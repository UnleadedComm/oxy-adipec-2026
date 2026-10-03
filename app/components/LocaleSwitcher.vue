<script setup lang="ts">
/**
 * Fixed language toggle, bottom-end corner. Links to the same page in the other locale
 * so the switch is a real navigation (crawlable, shareable).
 *
 * White by default; set `definePageMeta({ localeSwitcherInverted: true })` on light pages
 * to render it in brand blue.
 */
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

const otherLocale = computed(() => locales.value.find(l => l.code !== locale.value))
const inverted = computed(() => route.meta.localeSwitcherInverted === true)
</script>

<template>
  <NuxtLink
    v-if="otherLocale"
    :to="switchLocalePath(otherLocale.code)"
    class="fixed bottom-16 end-16 z-50 rounded-full border px-6 py-3 text-lg font-medium transition-colors"
    :class="inverted
      ? 'border-oxy-blue/40 text-oxy-blue hover:bg-oxy-blue hover:text-white'
      : 'border-white/40 text-white hover:bg-white hover:text-oxy-blue'"
    :lang="otherLocale.language"
    :hreflang="otherLocale.language"
  >
    {{ t('nav.switchLocale') }}
  </NuxtLink>
</template>
