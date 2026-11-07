import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

// The release artifacts live at the web root (`/static/js/...`), matching the
// long-standing gh-pages layout that the xeHentai binary proxies.
export default defineConfig({
  base: '/',
  plugins: [vue({
    // The webpack pipeline this project grew up with kept inter-element
    // whitespace in templates; Vue 2.7's compiler condenses it by default,
    // which reflows every inline badge/label. Preserve it to keep the layout
    // byte-for-byte identical.
    template: {
      compilerOptions: {
        whitespace: 'preserve'
      }
    }
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // element-ui ships CommonJS and would otherwise pull Vue's CJS runtime,
      // leaving the bundle with two Vue instances whose component registries
      // and config never see each other.
      vue: fileURLToPath(new URL('./node_modules/vue/dist/vue.runtime.esm.js', import.meta.url))
    },
    dedupe: ['vue'],
    // Single-file components are imported without the extension throughout
    // this codebase, as webpack's vue-loader used to allow.
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  server: {
    host: 'localhost',
    port: 8080
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    sourcemap: true,
    // One CSS bundle keeps the import order deterministic; splitting CSS per
    // chunk reorders element-ui's theme against the component styles.
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Mirror the old vendor/app split: framework code changes rarely and
        // caches separately from the application chunk.
        manualChunks (id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js') || id.includes('vue-chartjs')) return 'chart'
            return 'vendor'
          }
          return undefined
        }
      }
    }
  }
})
