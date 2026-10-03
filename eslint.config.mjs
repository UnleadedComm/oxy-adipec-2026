// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Project-specific overrides go here.
  // https://eslint.nuxt.com/packages/module#config-customizations
  {
    // Agency handoff package (reference only; the live port is app/lib/ecosystem).
    ignores: ['Ecosystem Packaged v18/**'],
  },
  {
    // Ported from the agency handoff ("Ecosystem Packaged v18/main.js"). Its compact
    // one-line statements are kept as written rather than rewrapped.
    files: ['app/lib/ecosystem/**'],
    rules: {
      '@stylistic/max-statements-per-line': 'off',
    },
  },
)
