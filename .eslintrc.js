module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended', // Vue 3 specific linting rules
    'plugin:nuxt/recommended', // Nuxt specific linting rules
    'prettier', // Turns off conflicting rules for Prettier
  ],
  plugins: ['vue', 'nuxt'],
  rules: {
    // Custom rules can be defined here
    'vue/multi-word-component-names': 'off', // Allows single-word component names
  },
}
