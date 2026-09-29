<script setup lang="ts">
const { $gsap } = useNuxtApp()
const hero = useTemplateRef<HTMLElement>('hero')

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
  />
</template>
