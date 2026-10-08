<script setup lang="ts">
import { preloadPdfs } from '~/lib/pdf-cache'

const { t, locale } = useI18n()
const { $gsap } = useNuxtApp()
const grid = useTemplateRef<HTMLElement>('grid')

// Transparent page: the app-level background video shows through, so the
// fixed chrome keeps its default white treatment (no light-page meta).
useHead({
  title: () => t('home.cards.fastFacts.title'),
})

// One tile per thumbnail in /public/fast-facts/thumbnails. Titles live under
// `fastFacts.cards.<key>` in the locale files. PDFs live in
// /public/fast-facts/pdf/<lang>/<pdf>-<LANG>.pdf and their download QR codes in
// /public/fast-facts/qr/<lang>/FastFacts<LANG><qr>.svg; the lightbox offers both
// languages regardless of the site locale.
const FILES: Record<string, { pdf: string, qr: string }> = {
  overview: { pdf: 'Oxy-Fast-Facts-Corporate-2026', qr: 'Corporate' },
  texas: { pdf: 'Oxy-Fast-Facts-Texas-2026', qr: 'Texas' },
  newMexico: { pdf: 'Oxy-Fast-Facts-New-Mexico-2026', qr: 'NewMexico' },
  rockies: { pdf: 'Oxy-Fast-Facts-Rockies-2026', qr: 'Rockies' },
  usOffshore: { pdf: 'Oxy-Fast-Facts-US-Offshore-2026', qr: 'USOffshore' },
  oman: { pdf: 'Oxy-Fast-Facts-Oman-2026', qr: 'Oman' },
  uae: { pdf: 'Oxy-Fast-Facts-UAE-2026', qr: 'UAE' },
  algeria: { pdf: 'Oxy-Fast-Facts-Algeria-2026', qr: 'Algeria' },
  lowCarbonVentures: { pdf: 'Oxy-Fast-Facts-Low-Carbon-Ventures-2026', qr: 'LowCarbonVentures' },
  directAirCapture: { pdf: 'Oxy-Fast-Facts-DAC-2026', qr: 'DAC' },
  carbonEngineering: { pdf: 'Oxy-Fast-Facts-Carbon-Engineering-2026', qr: 'CarbonEngineering' },
}

const pdfUrl = (lang: 'en' | 'ar', base: string) => `/fast-facts/pdf/${lang}/${base}-${lang.toUpperCase()}.pdf`
const qrUrl = (lang: 'en' | 'ar', name: string) => `/fast-facts/qr/${lang}/FastFacts${lang.toUpperCase()}${name}.svg`

const cards = [
  'overview',
  'texas',
  'newMexico',
  'rockies',
  'usOffshore',
  'oman',
  'uae',
  'algeria',
  'lowCarbonVentures',
  'carbonEngineering',
  'directAirCapture',
].map((key) => {
  const files = FILES[key]
  return {
    key,
    image: `/fast-facts/thumbnails/oxy-${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}.jpg`,
    pdf: files ? { en: pdfUrl('en', files.pdf), ar: pdfUrl('ar', files.pdf) } : undefined,
    qr: files ? { en: qrUrl('en', files.qr), ar: qrUrl('ar', files.qr) } : undefined,
  }
})

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (!grid.value) return

  // Reveal: tiles rise and fade in one after another. The wrappers are animated
  // rather than the tiles themselves because the tile root carries a CSS
  // transform transition for its hover lift, which would fight GSAP's updates.
  const mm = $gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    $gsap.from(grid.value!.children, {
      y: 32,
      opacity: 0,
      duration: 0.7,
      stagger: 0.06,
      ease: 'power3.out',
    })
  })

  onBeforeUnmount(() => mm.revert())

  // The kiosk serves everything locally, so once the page has settled pull
  // every document into memory, current language first. The lightbox then
  // opens from cache and its fade-in reveals painted pages.
  const langs = locale.value === 'ar' ? (['ar', 'en'] as const) : (['en', 'ar'] as const)
  const urls = langs.flatMap(l => cards.map(c => c.pdf?.[l]).filter((u): u is string => Boolean(u)))
  const run = () => {
    preloadPdfs(urls)
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(run)
  else setTimeout(run, 1)
})

// Leaving: the reveal in reverse — tiles sink and fade, last tile first — and
// navigation waits for it. Done as a route guard rather than a page transition
// because Vue resolves leave hooks from the destination page's transition
// config, and the other pages define none.
onBeforeRouteLeave(async () => {
  if (!grid.value || reduceMotion()) return
  await $gsap.to(grid.value.children, {
    y: 32,
    opacity: 0,
    duration: 0.45,
    stagger: { each: 0.04, from: 'end' },
    ease: 'power3.in',
    overwrite: true,
  })
})
</script>

<template>
  <main class="relative flex min-h-dvh w-full items-center justify-center">
    <div
      ref="grid"
      data-reveal
      class="grid w-7/12 grid-cols-4 gap-6"
    >
      <div
        v-for="card in cards"
        :key="card.key"
      >
        <FastFactCard
          :image="card.image"
          :image-alt="t(`fastFacts.cards.${card.key}`)"
          :eyebrow="t('fastFacts.eyebrow')"
          :title="t(`fastFacts.cards.${card.key}`)"
          :pdf="card.pdf"
          :qr="card.qr"
        />
      </div>
    </div>
  </main>
</template>
