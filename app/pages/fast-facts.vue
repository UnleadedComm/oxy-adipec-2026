<script setup lang="ts">
const { t } = useI18n()

// Transparent page: the app-level background video shows through, so the
// fixed chrome keeps its default white treatment (no light-page meta).
useHead({
  title: () => t('home.cards.fastFacts.title'),
})

// One tile per thumbnail in /public/fast-facts/thumbnails. Titles live under
// `fastFacts.cards.<key>` in the locale files.
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
}))
</script>

<template>
  <main class="relative flex min-h-dvh w-full items-center justify-center">
    <div class="grid w-8/12 grid-cols-4 gap-6">
      <FastFactCard
        v-for="card in cards"
        :key="card.key"
        :image="card.image"
        :image-alt="t(`fastFacts.cards.${card.key}`)"
        :eyebrow="t('fastFacts.eyebrow')"
        :title="t(`fastFacts.cards.${card.key}`)"
      />
    </div>
  </main>
</template>
