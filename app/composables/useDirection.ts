/**
 * Reading direction helpers for the active locale.
 *
 * `x` is a multiplier for horizontal GSAP offsets: `x: 40 * dirX.value` slides in
 * from the start edge in both LTR and RTL.
 */
export function useDirection() {
  const { locale, localeProperties } = useI18n()

  const dir = computed<'ltr' | 'rtl'>(() => localeProperties.value.dir === 'rtl' ? 'rtl' : 'ltr')
  const isRtl = computed(() => dir.value === 'rtl')
  const dirX = computed(() => (isRtl.value ? -1 : 1))

  return { locale, dir, isRtl, dirX }
}
