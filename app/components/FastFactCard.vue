<script setup lang="ts">
import { NuxtLink } from '#components'
import type { PdfSources } from '~/types/pdf'

/**
 * Fast Facts tile: cover image on top, white caption block below.
 * - `pdf`: the tile is a button that opens the PDF in a lightbox.
 * - `to`:  the tile is a link to that route.
 * - neither: a plain tile.
 */
const props = withDefaults(defineProps<{
  /** Image URL, served from /public. */
  image: string
  /** Alt text for the image. Pass an empty string if the title already describes it. */
  imageAlt?: string
  /** Small mono label above the title. */
  eyebrow?: string
  /** Card title. */
  title: string
  /** English + Arabic URLs of the PDF to open in a lightbox. */
  pdf?: PdfSources
  /** Optional route; already-localized paths expected (use localePath). */
  to?: string
}>(), {
  imageAlt: '',
  eyebrow: undefined,
  pdf: undefined,
  to: undefined,
})

const lightboxOpen = ref(false)

const tag = computed(() => (props.pdf ? 'button' : props.to ? NuxtLink : 'div'))
const interactive = computed(() => Boolean(props.pdf || props.to))
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="pdf ? 'button' : undefined"
    :aria-haspopup="pdf ? 'dialog' : undefined"
    class="group flex flex-col text-start"
    :class="interactive && 'cursor-pointer rounded-2xl transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'"
    @click="pdf && (lightboxOpen = true)"
  >
    <div class="h-[120px] overflow-hidden rounded-t-2xl">
      <img
        :src="image"
        :alt="imageAlt"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
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

  <PdfLightbox
    v-if="pdf"
    v-model:open="lightboxOpen"
    :sources="pdf"
    :title="title"
  />
</template>
