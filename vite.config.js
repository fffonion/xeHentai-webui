import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The release artifacts live at the web root (`/static/js/...`), matching the
// long-standing gh-pages layout that the xeHentai binary proxies.
export default defineConfig({
  base: '/',
  plugins: [vue({
    // Element spacing in this layout depends on the whitespace between inline
    // tags, so keep the compiler from condensing it.
    template: {
      compilerOptions: {
        whitespace: 'preserve'
      }
    }
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
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
