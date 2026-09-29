<script setup lang="ts">
/**
 * Inline Oxy logo. Fills are driven by CSS custom properties so they can be
 * transitioned in CSS or tweened with GSAP, e.g.
 *   gsap.to(logoEl, { '--oxy-logo-swoosh': '#fff', duration: 0.6 })
 * or by targeting the paths directly via `.oxy-logo__swoosh` / `.oxy-logo__wordmark`.
 */
withDefaults(defineProps<{
  /** Fill for the two blue swooshes. */
  swoosh?: string
  /** Fill for the OXY wordmark. */
  wordmark?: string
  /** Accessible label; pass an empty string to mark the logo decorative. */
  label?: string
}>(), {
  swoosh: 'var(--color-oxy-blue)',
  wordmark: 'var(--color-white)',
  label: 'Oxy',
})
</script>

<template>
  <svg
    class="oxy-logo"
    :style="{ '--oxy-logo-swoosh': swoosh, '--oxy-logo-wordmark': wordmark }"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="118 118 524 543"
    role="img"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <path
      class="oxy-logo__swoosh"
      d="M280.27,489.23c27.82,49,81,98.68,172.31,101.73,63.8-.25,114.65-26.35,152.66-72.3A159.67,159.67,0,0,0,624,489.26l4.54,0c-42.23,101.5-139.77,171.32-249.12,169.52-46-1.44-89-10.49-129.42-33.42,0,0-80.41-37.3-119.54-136.07Z"
    />
    <path
      class="oxy-logo__swoosh"
      d="M478.57,289.38c-27.85-49.06-80.91-98.69-172.28-101.73C242.46,187.89,191.63,214,153.6,260a160.32,160.32,0,0,0-18.72,29.39l-4.54,0c42.21-101.49,139.78-171.31,249.1-169.53,46.06,1.43,89,10.49,129.44,33.41,0,0,80.42,37.31,119.54,136.08Z"
    />
    <path
      class="oxy-logo__wordmark"
      d="M336.79,329.46l37.07,42.11,37.26-42.11h50.57l-57.77,59.39,60.65,60.47H413.28l-39.42-43-39.05,43H282.26l61.37-60.47-56.69-59.39Z"
    />
    <path
      class="oxy-logo__wordmark"
      d="M515.43,329.46l39.05,48.05,37.43-48.05H639.6L573.92,407v42.29h-37.8V407l-68.74-77.57Z"
    />
    <path
      class="oxy-logo__wordmark"
      d="M272.53,335.92c9.15,7,11.84,19,11.84,53.29,0,34.45-2.69,46.48-11.84,53.48s-20.46,8.25-70,8.25c-50.42,0-61.55-1.26-70.7-8.25-9.33-7.18-11.84-19-11.84-54.2,0-33.37,2.69-45.58,11.84-52.57s20.28-8.26,70.34-8.26S263.37,328.92,272.53,335.92ZM159.3,366.24c-2.16,4.13-2.87,10.95-2.87,26.2,0,14.89,1.07,19.74,5.38,23.15,4.84,3.77,10.59,4.31,40.73,4.31,29.25,0,35.17-.72,40-4.31,4.13-3.23,5.38-8.43,5.38-23,0-17.76-1.07-24.58-4.3-28.53-4.13-4.85-8.08-5.38-41.46-5.38C166.29,358.71,162.89,359.24,159.3,366.24Z"
    />
  </svg>
</template>

<style scoped>
.oxy-logo__swoosh {
  fill: var(--oxy-logo-swoosh);
  transition: fill 0.4s ease;
}

.oxy-logo__wordmark {
  fill: var(--oxy-logo-wordmark);
  transition: fill 0.4s ease;
}
</style>
