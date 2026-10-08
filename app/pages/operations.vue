<script setup lang="ts">
const { t } = useI18n()
const { $gsap } = useNuxtApp()

// Light page: Home button, logo and locale switcher switch to brand colours
// (see HomeButton.vue, app.vue, LocaleSwitcher.vue).
definePageMeta({
  homeTextColor: 'var(--color-oxy-blue)',
  logoSwoosh: 'var(--color-oxy-blue)',
  logoWordmark: 'var(--color-oxy-red)',
  localeSwitcherInverted: true,
})

useHead({
  title: () => t('operations.title').replace(/\n/g, ' '),
})

const backdrop = useTemplateRef<HTMLElement>('backdrop')
const scene = useTemplateRef<HTMLElement>('scene')

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (!backdrop.value) return

  // Fade the light backdrop in over the video. The explorer handles its own
  // entrance (chrome fades up once the model is ready).
  const mm = $gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    $gsap.from(backdrop.value, { opacity: 0, duration: 0.9, ease: 'power2.out' })
  })

  onBeforeUnmount(() => mm.revert())
})

// Leave: the explorer's header bar goes first, then its title, tab bar and
// viewer fade out one after another (opacity only, mirroring the explorer's own
// fade-up on boot), then the light backdrop fades so the video shows through.
// The route guard waits for the timeline, so the page stays mounted until it
// finishes.
onBeforeRouteLeave(async () => {
  if (reduceMotion()) return
  const tl = $gsap.timeline({ defaults: { ease: 'power2.in' } })
  const headerBar = scene.value?.querySelector('#headerBar')
  const parts = scene.value?.querySelectorAll('.explore-title, .tabs, .viewer-wrap') ?? []
  if (headerBar) tl.to(headerBar, { opacity: 0, duration: 0.3 }, 0)
  if (parts.length) tl.to(parts, { opacity: 0, duration: 0.4, stagger: 0.1 }, headerBar ? 0.15 : 0)
  if (backdrop.value) tl.to(backdrop.value, { opacity: 0, duration: 0.5, overwrite: true }, '-=0.2') // wins over a still-running entrance fade
  await tl
})
</script>

<template>
  <main class="relative min-h-dvh w-full">
    <div
      ref="backdrop"
      class="pointer-events-none fixed inset-0 -z-10 bg-[#f2f3f5]"
      aria-hidden="true"
    />
    <div
      ref="scene"
      class="w-full"
    >
      <EcosystemScene />
    </div>
  </main>
</template>
