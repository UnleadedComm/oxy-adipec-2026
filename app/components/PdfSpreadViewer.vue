<script setup lang="ts">
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { getPdfData, loadPdfjs } from '~/lib/pdf-cache'

/**
 * Magazine-style PDF viewer: renders two pages side by side as a spread,
 * scaled so the whole spread fits within `maxWidth` x `maxHeight`, and sizes
 * itself to exactly the rendered pages (no surrounding frame). Pages are
 * rendered with pdf.js onto canvases at device pixel ratio and re-fit when the
 * bounds change. With `rtl` the spread reads right-to-left (page 1 on the right).
 *
 * Documents come from the in-memory cache in ~/lib/pdf-cache (prefetched by
 * the Fast Facts page) and share one pdf.js worker. `ready` is emitted once per
 * `src` when the first spread has painted, or when loading fails, so a host can
 * hold its reveal until there is something to show.
 */
const props = withDefaults(defineProps<{
  /** PDF URL, served from /public. */
  src: string
  /** Largest CSS width the spread may take, in px. */
  maxWidth: number
  /** Largest CSS height the spread may take, in px. */
  maxHeight: number
  /** Pages per spread. */
  perSpread?: number
  /** Right-to-left document: page 1 sits on the right and arrows are mirrored. */
  rtl?: boolean
}>(), {
  perSpread: 2,
  rtl: false,
})

const emit = defineEmits<{
  /** First spread painted for the current `src`, or loading failed. */
  ready: []
}>()

const { t } = useI18n()
const isRtl = computed(() => props.rtl)

const canvases = useTemplateRef<HTMLCanvasElement[]>('canvases')

const loading = ref(true)
// CSS size of the rendered spread; the wrapper is set to exactly this.
const spreadSize = ref<{ width: number, height: number } | null>(null)
const error = ref(false)
const numPages = ref(0)
const spreadIndex = ref(0)

const spreadCount = computed(() => Math.ceil(numPages.value / props.perSpread))
const spreadPages = computed(() => {
  const first = spreadIndex.value * props.perSpread + 1
  return Array.from({ length: props.perSpread }, (_, i) => first + i).filter(n => n <= numPages.value)
})
const hasPrev = computed(() => spreadIndex.value > 0)
const hasNext = computed(() => spreadIndex.value < spreadCount.value - 1)

let loadingTask: PDFDocumentLoadingTask | null = null
let pdf: PDFDocumentProxy | null = null
let renderTasks: RenderTask[] = []
let frame = 0
let disposed = false
// Bumped per load() so a superseded load (src changed mid-flight) bails out.
let loadSeq = 0
let readyEmitted = false

function emitReady() {
  if (readyEmitted || disposed) return
  readyEmitted = true
  emit('ready')
}

const GAP = 0 // px between pages in a spread (0 = bound like a magazine)

async function load() {
  const seq = ++loadSeq
  const stale = () => disposed || seq !== loadSeq
  loading.value = true
  error.value = false
  readyEmitted = false
  try {
    const [{ pdfjs, worker }, data] = await Promise.all([loadPdfjs(), getPdfData(props.src)])
    if (stale()) return
    loadingTask?.destroy()
    loadingTask = pdfjs.getDocument({
      data,
      worker,
      // Runtime assets copied to /public/pdfjs by scripts/copy-pdfjs-assets.mjs (postinstall)
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      cMapUrl: '/pdfjs/cmaps/',
      wasmUrl: '/pdfjs/wasm/',
      // Draw glyphs as paths instead of loading embedded fonts through the Font
      // Loading API: TrueType subsets otherwise render with broken spacing here.
      disableFontFace: true,
    })
    const task = loadingTask
    const doc = await task.promise
    if (stale()) {
      task.destroy()
      return
    }
    pdf = doc
    numPages.value = doc.numPages
    spreadIndex.value = 0
    await nextTick()
    await render()
  }
  catch (err) {
    if (stale()) return
    console.error('[pdf] load failed:', err)
    error.value = true
    emitReady()
  }
  finally {
    if (!stale()) loading.value = false
  }
}

// Fit the current spread into the allowed bounds and paint it.
async function render() {
  const els = canvases.value
  if (!pdf || !els?.length) return
  for (const task of renderTasks) task.cancel()
  renderTasks = []

  const pages = await Promise.all(spreadPages.value.map(n => pdf!.getPage(n)))
  if (disposed) return
  const base = pages.map(p => p.getViewport({ scale: 1 }))
  const spreadW = base.reduce((w, v) => w + v.width, 0) + GAP * (base.length - 1)
  const spreadH = Math.max(...base.map(v => v.height))
  const scale = Math.min(props.maxWidth / spreadW, props.maxHeight / spreadH)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  let totalW = GAP * (pages.length - 1)
  let totalH = 0
  pages.forEach((page, i) => {
    const canvas = els[i]
    if (!canvas) return
    const viewport = page.getViewport({ scale: scale * dpr })
    const cssW = Math.floor(viewport.width / dpr)
    const cssH = Math.floor(viewport.height / dpr)
    totalW += cssW
    totalH = Math.max(totalH, cssH)
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const task = page.render({ canvas, canvasContext: ctx, viewport })
    renderTasks.push(task)
    task.promise.catch((err: unknown) => {
      // cancellations are expected on resize / spread change
      if ((err as { name?: string })?.name !== 'RenderingCancelledException') console.error('[pdf] render failed:', err)
    })
  })
  spreadSize.value = { width: totalW, height: totalH }
  // First complete paint for this document: tell the host it can reveal.
  Promise.all(renderTasks.map(t => t.promise)).then(emitReady, () => {})
}

function scheduleRender() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    render()
  })
}

function go(delta: number) {
  const next = spreadIndex.value + delta
  if (next < 0 || next >= spreadCount.value) return
  spreadIndex.value = next
}

function onKey(e: KeyboardEvent) {
  const forward = isRtl.value ? 'ArrowLeft' : 'ArrowRight'
  const back = isRtl.value ? 'ArrowRight' : 'ArrowLeft'
  if (e.key === forward) go(1)
  else if (e.key === back) go(-1)
}

watch(spreadIndex, async () => {
  await nextTick()
  scheduleRender()
})
watch(() => props.src, load)
watch(() => [props.maxWidth, props.maxHeight], scheduleRender)

onMounted(() => {
  window.addEventListener('keydown', onKey)
  load()
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(frame)
  for (const task of renderTasks) task.cancel()
  window.removeEventListener('keydown', onKey)
  loadingTask?.destroy()
  loadingTask = null
  pdf = null
})
</script>

<template>
  <div
    class="relative overflow-hidden"
    :class="!spreadSize && 'min-h-[320px] min-w-[480px]'"
    :style="spreadSize ? { width: `${spreadSize.width}px`, height: `${spreadSize.height}px` } : undefined"
  >
    <div
      class="flex items-start"
      :class="isRtl ? 'flex-row-reverse' : 'flex-row'"
      :style="{ gap: `${GAP}px` }"
    >
      <canvas
        v-for="n in spreadPages"
        :key="n"
        ref="canvases"
        class="block bg-white"
        :aria-label="t('common.pageOf', { n, total: numPages })"
        role="img"
      />
    </div>

    <p
      v-if="loading"
      class="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-mono text-sm text-navy/70 uppercase"
      aria-live="polite"
    >
      {{ t('common.loading') }}
    </p>
    <p
      v-else-if="error"
      class="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-navy/70"
    >
      {{ t('common.pdfError') }}
    </p>

    <template v-if="spreadCount > 1">
      <button
        type="button"
        class="absolute top-1/2 start-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-md transition hover:bg-white disabled:opacity-30"
        :disabled="!hasPrev"
        :aria-label="t('common.previous')"
        @click="go(-1)"
      >
        <svg
          class="size-5 rtl:-scale-x-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        ><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <button
        type="button"
        class="absolute top-1/2 end-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-md transition hover:bg-white disabled:opacity-30"
        :disabled="!hasNext"
        :aria-label="t('common.next')"
        @click="go(1)"
      >
        <svg
          class="size-5 rtl:-scale-x-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        ><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </template>
  </div>
</template>
