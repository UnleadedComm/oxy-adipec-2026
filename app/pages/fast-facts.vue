<script setup lang="ts">
const { t } = useI18n()

// Transparent page: the app-level background video shows through, so the
// fixed chrome keeps its default white treatment (no light-page meta).
useHead({
  title: () => t('home.cards.fastFacts.title'),
})

// One tile per thumbnail in /public/fast-facts/thumbnails. Titles live under
// `fastFacts.cards.<key>` in the locale files. PDFs live in
// /public/fast-facts/pdf/<lang>/ and share filenames across languages; the
// lightbox offers both versions regardless of the site locale.
const PDF_FILES: Record<string, string> = {
  overview: '26-OXY-0239_Oxy_Fast_Facts_2026_CORPORATE r3_WEB.pdf',
  texas: '26-OXY-0239_Oxy_Fast_Facts_2026_TEXAS r3_WEB.pdf',
  newMexico: '26-OXY-0239_Oxy_Fast_Facts_2026_NEW MEXICO r3_WEB.pdf',
  rockies: '26-OXY-0239_Oxy_Fast_Facts_2026_ROCKIES r4_WEB.pdf',
  usOffshore: '26-OXY-0239_Oxy_Fast_Facts_2026_USOffshore r3_WEB.pdf',
  oman: '26-OXY-0239_Oxy_Fast_Facts_2026_OMAN r7_WEB.pdf',
  uae: '26-OXY-0239_Oxy_Fast_Facts_2026_UAE r4_WEB.pdf',
  algeria: '26-OXY-0239_Oxy_Fast_Facts_2026_ALGERIA r3_WEB.pdf',
  lowCarbonVentures: '26-OXY-0239_Oxy_Fast_Facts_2026_LowCarbonVentures r4_WEB.pdf',
  directAirCapture: '26-OXY-0239_Oxy_Fast_Facts_2026_DAC_r3_WEB.pdf',
  // carbonEngineering: no PDF supplied yet — tile stays non-interactive
}

const pdfUrl = (lang: 'en' | 'ar', file: string) => `/fast-facts/pdf/${lang}/${encodeURIComponent(file)}`

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
