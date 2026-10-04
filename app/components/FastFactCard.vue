<script setup lang="ts">
import { NuxtLink } from '#components'

/**
 * Fast Facts tile: cover image on top, white caption block below.
 * Renders as a link when `to` is given, otherwise as a plain tile.
 */
withDefaults(defineProps<{
  /** Image URL, served from /public. */
  image: string
  /** Alt text for the image. Pass an empty string if the title already describes it. */
  imageAlt?: string
  /** Small mono label above the title. */
  eyebrow?: string
  /** Card title. */
  title: string
  /** Optional route; already-localized paths expected (use localePath). */
  to?: string
}>(), {
  imageAlt: '',
  eyebrow: undefined,
  to: undefined,
})
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    class="flex flex-col"
  >
    <div class="h-[120px] overflow-hidden rounded-t-2xl">
      <img
        :src="image"
        :alt="imageAlt"
        class="size-full object-cover"
        loading="lazy"
        decoding="async"
      >
    </div>
    <div class="rounded-b-2xl bg-white p-6">
      <span
        v-if="eyebrow"
        class="block font-mono text-sm font-medium text-navy uppercase"
      >{{ eyebrow }}</span>
      <span class="block font-sans text-xl font-semibold text-navy">{{ title }}</span>
    </div>
  </component>
</template>
