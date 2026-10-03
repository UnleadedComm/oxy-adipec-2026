<script setup lang="ts">
import { NuxtLink } from '#components'

/**
 * Square tile with a cover image on top and a frosted caption bar below.
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
    class="block size-[420px] overflow-hidden rounded-2xl"
  >
    <div class="h-8/12 w-full">
      <img
        :src="image"
        :alt="imageAlt"
        class="size-full object-cover"
        width="420"
        height="280"
        loading="eager"
        decoding="async"
      >
    </div>
    <div class="rounded-b-2xl bg-white/35 p-8 backdrop-blur-md">
      <span
        v-if="eyebrow"
        class="block font-mono font-medium text-white uppercase"
      >{{ eyebrow }}</span>
      <h2 class="font-wide text-3xl text-white">
        {{ title }}
      </h2>
    </div>
  </component>
</template>
