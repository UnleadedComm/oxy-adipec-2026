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
    class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-24"
  >
    <p
      data-animate
      class="text-sm font-semibold tracking-widest text-brand uppercase"
    >
      Oxy · ADIPEC 2026
    </p>
    <h1
      data-animate
      class="text-5xl font-bold tracking-tight sm:text-6xl"
    >
      Nuxt 4 · Vite 8 · Tailwind CSS 4 · GSAP 3
    </h1>
    <p
      data-animate
      class="max-w-prose text-lg text-neutral-600"
    >
      Project scaffold is ready. Edit
      <code class="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-base">app/pages/index.vue</code>
      to get started.
    </p>
    <div
      data-animate
      class="flex gap-3"
    >
      <a
        href="https://nuxt.com/docs"
        class="rounded-md bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark"
      >
        Nuxt docs
      </a>
      <a
        href="https://gsap.com/docs/v3/"
        class="rounded-md border border-neutral-300 px-4 py-2 font-medium transition hover:bg-neutral-50"
      >
        GSAP docs
      </a>
    </div>
  </main>
</template>
