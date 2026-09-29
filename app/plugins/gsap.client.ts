import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registers GSAP plugins once on the client and exposes `$gsap` via useNuxtApp().
export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger)

  return {
    provide: { gsap },
  }
})
