# oxy-adipec-2026

Nuxt 4 site built with Vite 8, Tailwind CSS 4 and GSAP 3. Linted with ESLint (via `@nuxt/eslint`, Stylistic rules for formatting) and Stylelint.

## Requirements

- Node.js 22.12 or newer
- npm

## Setup

```bash
npm install
```

## Scripts

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Start the dev server on http://localhost:3000  |
| `npm run build`     | Production build to `.output/`                 |
| `npm run preview`   | Serve the production build locally             |
| `npm run generate`  | Static site generation                         |
| `npm run lint`      | Run ESLint and Stylelint                       |
| `npm run lint:fix`  | Auto-fix ESLint and Stylelint findings         |
| `npm run typecheck` | Type-check with vue-tsc                        |

## Project layout

```
app/
  app.vue              Root component
  assets/css/main.css  Tailwind entry + @theme design tokens
  pages/index.vue      Home page (GSAP demo)
  plugins/gsap.client.ts  Registers GSAP plugins, provides $gsap
eslint.config.mjs      ESLint flat config (extends generated Nuxt config)
stylelint.config.mjs   Stylelint config (standard + Vue + property order, Tailwind-aware)
nuxt.config.ts         Nuxt config (Tailwind Vite plugin, ESLint module)
```

## Notes

- Tailwind CSS 4 is configured in CSS, not a JS config file. Add tokens in the `@theme` block of `app/assets/css/main.css`.
- Use GSAP inside `onMounted` or other client-only code. `useNuxtApp().$gsap` has ScrollTrigger already registered.
- Formatting is handled by ESLint Stylistic; there is no Prettier.
