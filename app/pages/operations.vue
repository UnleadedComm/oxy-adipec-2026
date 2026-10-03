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
</script>

<template>
  <main class="relative min-h-dvh w-full">
    <div
      ref="backdrop"
      class="pointer-events-none fixed inset-0 -z-10 bg-[#f2f3f5]"
      aria-hidden="true"
    />
    <div class="w-full">
      <EcosystemScene />
    </div>
  </main>
</template>
