import tailwindcss from '@tailwindcss/vite'

// Fonts fetched before first paint. Keep this list short; every entry is a blocking-ish download.
const preloadFonts = [
  '/fonts/spezia-normal/Spezia-Regular.woff2',
  '/fonts/spezia-normal/Spezia-Bold.woff2',
  '/fonts/spezia-wide/SpeziaWide-Bold.woff2',
]

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],

  devtools: { enabled: true },

  app: {
    head: {
      link: preloadFonts.map(href => ({
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href,
        crossorigin: '',
      })),
    },
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',

  vite: {
    plugins: [tailwindcss()],
  },

  eslint: {
    config: {
      // Use ESLint Stylistic for formatting rules instead of Prettier.
      stylistic: true,
    },
  },
})
