<script setup lang="ts">
/**
 * Modal PDF viewer on the native <dialog> element: Esc and a backdrop click
 * dismiss it. The dialog shrink-wraps the two-page spread that PdfSpreadViewer
 * fits into the viewport allowance, so the frame is exactly the size of the
 * pages. The viewer is only mounted while open so the PDF is not fetched until
 * needed. A QR code to the PDF for the showing language hangs off the right
 * edge of the spread, bottom-aligned with it, in both reading directions; it is
 * absolutely positioned so it never affects the spread's size.
 */
import { PDF_DOWNLOAD_LABELS, PDF_LANGUAGE_LABELS, type PdfLanguage, type PdfSources } from '~/types/pdf'

const props = defineProps<{
  /** English + Arabic URLs of the same document. */
  sources: PdfSources
  /** English + Arabic QR code images linking to the document. Omit to hide the QR block. */
  qr?: PdfSources
  /** Accessible name for the dialog. */
  title: string
}>()

const open = defineModel<boolean>('open', { default: false })
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const footer = useTemplateRef<HTMLElement>('footer')

// Which language version is showing. Starts from the site locale each time the
// lightbox opens, but switching here never changes the site locale.
const { locale, t } = useI18n()
const lang = ref<PdfLanguage>(locale.value === 'ar' ? 'ar' : 'en')
const src = computed(() => props.sources[lang.value])
const languages = Object.keys(PDF_LANGUAGE_LABELS) as PdfLanguage[]

// Largest spread the viewer may render (CSS px): viewport allowance minus the
// language switcher below the pages. Subtract a header here too if reinstated.
// The QR code is positioned outside the flow and does not reduce the budget.
const bounds = ref({ width: 0, height: 0 })
function measure() {
  bounds.value = {
    width: Math.floor(Math.min(window.innerWidth * 0.96, 1920)),
    height: Math.floor(Math.min(window.innerHeight * 0.80, 1200) - (footer.value?.offsetHeight ?? 0)),
  }
}

watch(open, async (isOpen) => {
  const el = dialog.value
  if (!el) return
  if (isOpen && !el.open) {
    lang.value = locale.value === 'ar' ? 'ar' : 'en'
    el.showModal()
    await nextTick()
    measure()
  }
  else if (!isOpen && el.open) {
    el.close()
  }
})

onMounted(() => window.addEventListener('resize', measure))
onBeforeUnmount(() => window.removeEventListener('resize', measure))

function onCancel(e: Event) {
  e.preventDefault() // let the state drive close so the transition plays
  open.value = false
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialog.value) open.value = false
}
</script>

<template>
  <Teleport to="#teleports">
    <dialog
      ref="dialog"
      class="m-auto size-fit max-h-[94dvh] max-w-[96vw] overflow-visible bg-transparent p-0 opacity-0 transition-[opacity,display,overlay] duration-300 transition-discrete open:opacity-100 open:starting:opacity-0"
      :aria-label="title"
      @cancel="onCancel"
      @click="onBackdropClick"
      @close="open = false"
    >
      <div class="flex flex-col">
        <!-- <header class="flex items-center justify-between gap-4 border-b border-med-gray px-6 py-4">
          <h2 class="truncate font-sans text-lg font-semibold text-navy">
            {{ title }}
          </h2>
          <div class="flex items-center gap-3">
            <a
              :href="src"
              target="_blank"
              rel="noopener"
              class="text-sm font-medium text-oxy-blue hover:underline"
            >{{ t('common.openInNewTab') }}</a>
            <button
              type="button"
              class="flex size-10 items-center justify-center rounded-full text-navy transition-colors hover:bg-light-gray"
              :aria-label="t('common.close')"
              @click="open = false"
            >
              <svg
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header> -->
        <div class="relative">
          <div class="overflow-hidden rounded-2xl">
            <PdfSpreadViewer
              v-if="open && bounds.width > 0"
              :src="src"
              :rtl="lang === 'ar'"
              :max-width="bounds.width"
              :max-height="bounds.height"
            />
          </div>
          <!-- Close button straddles the spread's top-right corner (physical right
               in both directions). The icon file has no fill, so it is applied as a
               mask over a navy background rather than as an <img>. -->
          <button
            type="button"
            class="absolute top-0 right-0 z-10 flex translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-slate-200 shadow-lg p-2 transition-colors hover:bg-light-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            :aria-label="t('common.close')"
            @click="open = false"
          >
            <span
              class="block size-5 bg-navy mask-[url(/close.svg)] mask-contain mask-center mask-no-repeat"
              aria-hidden="true"
            />
          </button>
          <!-- QR code hangs off the physical right edge of the spread, bottom-aligned,
               outside the flow so the spread keeps its full width budget. -->
          <div
            v-if="qr"
            class="absolute bottom-0 left-full ml-6 flex flex-col items-center gap-2"
            :lang="lang"
          >
            <div class="shrink-0 rounded-xl bg-white p-3">
              <!-- max-w-none: the out-of-flow wrapper has no definite width, so
                   preflight's img { max-width: 100% } would shrink the code to the
                   caption's width. Keep it a fixed 1:1 square. -->
              <img
                :src="qr[lang]"
                alt=""
                class="block aspect-square size-28 max-w-none"
                decoding="async"
              >
            </div>
            <!-- Caption + icon. The row is LTR so the icon always sits on the right;
                 the text sets its own direction from the showing language. The icon
                 is black (currentColor in an <img> does not inherit), so invert it. -->
            <span
              dir="ltr"
              class="flex items-center gap-1.5 font-mono text-sm font-normal uppercase whitespace-nowrap text-white"
            >
              <span :dir="lang === 'ar' ? 'rtl' : 'ltr'">{{ PDF_DOWNLOAD_LABELS[lang] }}</span>
              <img
                src="/download-icon.svg"
                alt=""
                class="size-4 invert"
                aria-hidden="true"
              >
            </span>
          </div>
        </div>
        <!-- Language switcher sits below the spread on the backdrop, no background -->
        <footer
          ref="footer"
          class="flex items-center justify-center gap-8 pt-5 pb-1"
        >
          <template
            v-for="(code, i) in languages"
            :key="code"
          >
            <span
              v-if="i > 0"
              class="h-6 w-0.5 bg-white/70"
              aria-hidden="true"
            />
            <button
              type="button"
              :lang="code"
              :aria-pressed="lang === code"
              class="font-sans text-lg underline-offset-8 transition-colors"
              :class="lang === code ? 'font-semibold text-white underline' : 'text-white/70 hover:text-white'"
              @click="lang = code"
            >
              {{ PDF_LANGUAGE_LABELS[code] }}
            </button>
          </template>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>
