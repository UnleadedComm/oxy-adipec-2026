import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

// Registers GSAP plugins once on the client and exposes `$gsap` via useNuxtApp().
// SplitText is imported directly from 'gsap/SplitText' where a page needs it.
export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText)

  return {
    provide: { gsap },
  }
})
