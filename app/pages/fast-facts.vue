<script setup lang="ts">
const { t } = useI18n()

// Transparent page: the app-level background video shows through, so the
// fixed chrome keeps its default white treatment (no light-page meta).
useHead({
  title: () => t('home.cards.fastFacts.title'),
})

// One tile per thumbnail in /public/fast-facts/thumbnails. Titles live under
// `fastFacts.cards.<key>` in the locale files. PDFs live in
// /public/fast-facts/pdf/<lang>/<base>-<LANG>.pdf; the lightbox offers both
// languages regardless of the site locale.
const PDF_FILES: Record<string, string> = {
  overview: 'Oxy-Fast-Facts-Corporate-2026',
  texas: 'Oxy-Fast-Facts-Texas-2026',
  newMexico: 'Oxy-Fast-Facts-New-Mexico-2026',
  rockies: 'Oxy-Fast-Facts-Rockies-2026',
  usOffshore: 'Oxy-Fast-Facts-US-Offshore-2026',
  oman: 'Oxy-Fast-Facts-Oman-2026',
  uae: 'Oxy-Fast-Facts-UAE-2026',
  algeria: 'Oxy-Fast-Facts-Algeria-2026',
  lowCarbonVentures: 'Oxy-Fast-Facts-Low-Carbon-Ventures-2026',
  directAirCapture: 'Oxy-Fast-Facts-DAC-2026',
  // carbonEngineering: no PDF supplied yet — tile stays non-interactive
}

const pdfUrl = (lang: 'en' | 'ar', base: string) => `/fast-facts/pdf/${lang}/${base}-${lang.toUpperCase()}.pdf`

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
].map(key => ({
  key,
  image: `/fast-facts/thumbnails/oxy-${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}.jpg`,
  pdf: PDF_FILES[key] ? { en: pdfUrl('en', PDF_FILES[key]), ar: pdfUrl('ar', PDF_FILES[key]) } : undefined,
}))
</script>

<template>
  <main class="relative flex min-h-dvh w-full items-center justify-center">
    <div class="grid w-7/12 grid-cols-4 gap-6">
      <FastFactCard
        v-for="card in cards"
        :key="card.key"
        :image="card.image"
        :image-alt="t(`fastFacts.cards.${card.key}`)"
        :eyebrow="t('fastFacts.eyebrow')"
        :title="t(`fastFacts.cards.${card.key}`)"
        :pdf="card.pdf"
      />
    </div>
  </main>
</template>
