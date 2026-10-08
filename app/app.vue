<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// Per-page logo colours via definePageMeta({ logoSwoosh, logoWordmark }). OxyLogo transitions the fills.
const logoSwoosh = computed(() => route.meta.logoSwoosh ?? '#fff')
const logoWordmark = computed(() => route.meta.logoWordmark ?? '#fff')

// <html lang>/<html dir> per locale, plus hreflang alternates and canonical link.
const head = useLocaleHead()

useHead({
  htmlAttrs: {
    lang: () => head.value.htmlAttrs.lang,
    dir: () => head.value.htmlAttrs.dir,
  },
  link: () => head.value.link,
  meta: () => head.value.meta,
  title: () => t('site.title'),
})

useSeoMeta({
  description: () => t('site.description'),
})
</script>

<template>
  <div class="relative min-h-dvh w-full text-white antialiased">
    <BackgroundVideo />
    <NuxtRouteAnnouncer />

    <NuxtLink
      :to="localePath('/')"
      class="fixed top-16 start-18 z-50 block w-40 sm:w-40"
      :aria-label="t('nav.homeAriaLabel')"
    >
      <OxyLogo
        :swoosh="logoSwoosh"
        :wordmark="logoWordmark"
        label=""
        class="h-auto w-full"
      />
    </NuxtLink>

    <!-- Locale switcher temporarily hidden; restore by uncommenting. -->
    <!-- <LocaleSwitcher /> -->
    <HomeButton />

    <NuxtPage />
  </div>
</template>
