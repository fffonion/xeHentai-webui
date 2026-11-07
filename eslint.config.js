import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'tmp/**', 'node_modules/**']
  },
  ...pluginVue.configs['flat/vue2-essential'],
  {
    files: ['**/*.{js,mjs,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
      'no-undef': 'error',
      // element-ui dialogs are driven through `:visible.sync`, which mutates
      // the prop by design; component names predate the rule as well.
      'vue/no-mutating-props': 'off',
      'vue/multi-word-component-names': 'off'
    }
  }
]
