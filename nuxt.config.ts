import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],

  devtools: { enabled: true },

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
