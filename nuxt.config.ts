import tailwindcss from '@tailwindcss/vite'

// Fonts fetched before first paint. Keep this list short; every entry is a blocking-ish download.
const preloadFonts = [
  '/fonts/spezia-normal/Spezia-Regular.woff2',
  '/fonts/spezia-normal/Spezia-Bold.woff2',
  '/fonts/spezia-wide/SpeziaWide-Bold.woff2',
]

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/i18n'],

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

  // https://i18n.nuxtjs.org/docs/getting-started/usage
  // Locale files live in i18n/locales/ and are lazy-loaded per locale.
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', dir: 'ltr', name: 'English', file: 'en.json' },
      { code: 'ar', language: 'ar-AE', dir: 'rtl', name: 'العربية', file: 'ar.json' },
    ],
    defaultLocale: 'en',
    // English at the root, Arabic under /ar/.
    strategy: 'prefix_except_default',
    // Absolute origin for hreflang/canonical links. Set NUXT_PUBLIC_SITE_URL in production.
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      // Only redirect on first visit to the root, so deep links keep their locale.
      redirectOn: 'root',
    },
  },
})
