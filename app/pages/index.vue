<script setup lang="ts">
import { SplitText } from 'gsap/SplitText'

const { $gsap } = useNuxtApp()
const { t } = useI18n()
const localePath = useLocalePath()
const hero = useTemplateRef<HTMLElement>('hero')
const heading = useTemplateRef<HTMLElement>('heading')
const cardGrid = useTemplateRef<HTMLElement>('cardGrid')

// Copy for each card lives under `home.cards.<key>` in the locale files.
// `to` is an unlocalized path; it is run through localePath in the template.
const cards: { key: string, image: string, to?: string }[] = [
  { key: 'operations', image: '/oxy-operations-bg.webp', to: '/operations' },
  { key: 'fastFacts', image: '/oxy-fast-facts-bg.webp', to: '/fast-facts' },
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

// Leave transition: the heading's words slide down behind per-word masks while
// the cards fade down and away. The route guard waits for the timeline, so the
// page stays mounted until it finishes. Skipped for reduced-motion users.
function playLeave() {
  return new Promise<void>((resolve) => {
    const tl = $gsap.timeline({ defaults: { ease: 'power2.in' }, onComplete: resolve })

    if (heading.value) {
      const split = SplitText.create(heading.value, { type: 'words', mask: 'words' })
      tl.to(split.words, { yPercent: 110, duration: 0.5, stagger: 0.05 }, 0)
    }

    const cards = cardGrid.value ? Array.from(cardGrid.value.children) : []
    if (cards.length) {
      tl.to(cards, { y: 48, opacity: 0, duration: 0.5, stagger: 0.1 }, 0.1)
    }
  })
}

onBeforeRouteLeave(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await playLeave()
})
</script>

<template>
  <main
    ref="hero"
  >
    <div class="w-full h-screen flex items-center justify-center">
      <div class="max-w-7xl flex flex-col justify-center items-center gap-16">
        <div>
          <h1
            ref="heading"
            class="text-white text-6xl font-semibold"
          >
            Explore Our Operations
          </h1>
        </div>
        <div
          ref="cardGrid"
          class="grid grid-cols-2 gap-12"
        >
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
