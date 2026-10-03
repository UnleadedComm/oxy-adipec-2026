<script setup lang="ts">
const { $gsap } = useNuxtApp()
const { t } = useI18n()
const localePath = useLocalePath()
const hero = useTemplateRef<HTMLElement>('hero')

// Copy for each card lives under `home.cards.<key>` in the locale files.
// `to` is an unlocalized path; it is run through localePath in the template.
const cards: { key: string, image: string, to?: string }[] = [
  { key: 'operations', image: '/oxy-operations-bg.webp', to: '/operations' },
  { key: 'fastFacts', image: '/oxy-fast-facts-bg.webp' },
]

onMounted(() => {
  if (!hero.value) return

  $gsap.from(hero.value.querySelectorAll('[data-animate]'), {
    y: 24,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
  })
})
</script>

<template>
  <main
    ref="hero"
  >
    <div class="w-full h-screen flex items-center justify-center">
      <div class="max-w-7xl flex flex-col justify-center items-center gap-16">
        <div>
          <h1 class="text-white text-6xl font-semibold">
            Explore Our Operations
          </h1>
        </div>
        <div class="grid grid-cols-2 gap-12">
          <OperationCard
            v-for="card in cards"
            :key="card.key"
            :image="card.image"
            :image-alt="t(`home.cards.${card.key}.imageAlt`)"
            :eyebrow="t(`home.cards.${card.key}.eyebrow`)"
            :title="t(`home.cards.${card.key}.title`)"
            :to="card.to ? localePath(card.to) : undefined"
          />
        </div>
      </div>
    </div>
  </main>
</template>
