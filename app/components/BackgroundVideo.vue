<script setup lang="ts">
/**
 * Full-viewport looping background video, fixed behind all page content.
 * Silent and decorative: muted, autoplay, hidden from assistive tech.
 * Pauses when the user prefers reduced motion.
 */
withDefaults(defineProps<{
  /** Video source URL, served from /public. */
  src?: string
  /** Optional poster shown before the first frame decodes. */
  poster?: string
}>(), {
  src: '/OXY_Tesseract_Background.mp4',
  poster: undefined,
})

const video = useTemplateRef<HTMLVideoElement>('video')

onMounted(() => {
  const el = video.value
  if (!el) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  const sync = () => {
    if (reduceMotion.matches) {
      el.pause()
    }
    else {
      // play() can reject if autoplay is blocked; a static first frame is an acceptable fallback.
      el.play().catch(() => {})
    }
  }

  sync()
  reduceMotion.addEventListener('change', sync)
  onBeforeUnmount(() => reduceMotion.removeEventListener('change', sync))
})
</script>

<template>
  <video
    ref="video"
    class="pointer-events-none fixed inset-0 -z-10 size-full object-cover"
    :src="src"
    :poster="poster"
    autoplay
    muted
    loop
    playsinline
    disablepictureinpicture
    preload="auto"
    aria-hidden="true"
    tabindex="-1"
  />
</template>
