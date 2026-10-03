# oxy-adipec-2026

Nuxt 4 site built with Vite 8, Tailwind CSS 4 and GSAP 3. Bilingual (English / Arabic, RTL) via `@nuxtjs/i18n`. Linted with ESLint (via `@nuxt/eslint`, Stylistic rules for formatting) and Stylelint.

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
  app.vue              Root component (sets <html lang/dir> and hreflang via useLocaleHead)
  assets/css/main.css  Tailwind entry + @theme design tokens (+ Arabic font fallback)
  components/LocaleSwitcher.vue  EN/AR toggle linking to the same page in the other locale
  components/EcosystemScene.vue  Three.js "Ecosystem Explorer" (markup + client boot)
  assets/css/ecosystem.css       Explorer styles, namespaced under .ecosystem-explorer
  lib/ecosystem/scene.js         Explorer engine (ported from the agency handoff package)
  composables/useDirection.ts    dir / isRtl / dirX helpers for RTL-aware layout and GSAP
  pages/index.vue      Home page
  pages/operations.vue Operations page: hosts <EcosystemScene>
  plugins/gsap.client.ts  Registers GSAP plugins, provides $gsap
i18n/locales/          en.json, ar.json translation messages (lazy-loaded per locale)
public/ecosystem/      ecosystem.glb (Draco + WebP, ~14 MB) and the Draco decoder files
Ecosystem Packaged v18/  Agency handoff package, reference only (ignored by lint)
eslint.config.mjs      ESLint flat config (extends generated Nuxt config)
stylelint.config.mjs   Stylelint config (standard + Vue + property order, Tailwind-aware)
nuxt.config.ts         Nuxt config (Tailwind Vite plugin, ESLint module, i18n)
```

## Localization

- Locales: `en` (default, served at `/`) and `ar` (served at `/ar/...`). Strategy is `prefix_except_default`.
- Add strings to both `i18n/locales/en.json` and `i18n/locales/ar.json`, then use `t('key')` from `useI18n()` in components.
- Link with `localePath('/path')` instead of hard-coded paths so links stay in the current locale. `useSwitchLocalePath()` gives the same page in another locale.
- Numbers and dates: use `n(value)` / `d(date)` from `useI18n()` so Arabic formatting goes through `Intl`.
- RTL layout: prefer Tailwind logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) over left/right. Use `rtl:` / `ltr:` variants for explicit overrides.
- Horizontal GSAP motion: multiply x offsets by `dirX` from `useDirection()` so animations enter from the start edge in both directions.
- Spezia has no Arabic glyphs. `main.css` falls back to system Arabic fonts under `:lang(ar)`; swap in the approved Arabic brand face there when available.
- Set `NUXT_PUBLIC_SITE_URL` in production so hreflang and canonical links use the real origin.

## Ecosystem Explorer

- `<EcosystemScene>` renders the interactive 3D scene; `app/lib/ecosystem/scene.js` is loaded on the client after mount and torn down on unmount (`dispose()` releases listeners, timers and GPU resources). Mount one instance per page (it addresses its DOM by id).
- The approved look (`BAKED_LOOK` at the top of scene.js) is merged into `CONFIG` at boot. Pass `config: { ... }` through `createEcosystemScene` options to override keys without editing the module.
- Model and Draco decoder live in `public/ecosystem/`. Request re-exports of the GLB rather than editing it.
- Facility, pathway and flow-line copy still lives in the data tables at the top of scene.js (English). The surrounding chrome (title, tabs, hint) is translated via `ecosystem.*` keys.
- `Explore …` / `Learn more` links are placeholders (`href="#"`); wire them in `PATHWAYS[].link.href` and `FACILITY_DEFS[].href`.

## Notes

- Tailwind CSS 4 is configured in CSS, not a JS config file. Add tokens in the `@theme` block of `app/assets/css/main.css`.
- Use GSAP inside `onMounted` or other client-only code. `useNuxtApp().$gsap` has ScrollTrigger already registered.
- Formatting is handled by ESLint Stylistic; there is no Prettier.
