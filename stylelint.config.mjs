/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-vue',
    'stylelint-config-recess-order',
  ],
  ignoreFiles: [
    'node_modules/**',
    '.nuxt/**',
    '.output/**',
    'dist/**',
  ],
  rules: {
    // Tailwind CSS v4 directives.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'source',
          'utility',
          'variant',
          'custom-variant',
          'apply',
          'reference',
          'plugin',
          'config',
        ],
      },
    ],
    // Tailwind CSS v4 functions.
    'function-no-unknown': [
      true,
      { ignoreFunctions: ['theme', '--alpha', '--spacing', '--theme'] },
    ],
    'import-notation': 'string',
    // Utility-first class names don't follow kebab-case.
    'selector-class-pattern': null,
  },
}
