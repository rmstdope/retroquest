import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { debugScriptsPlugin } from './debugScripts.config.ts'
import { thumbnailsPlugin } from './thumbnails.config.ts'
import { shouldOpenBrowser } from './devServerOpen.config.ts'

export default defineConfig({
  plugins: [
    vue(),
    debugScriptsPlugin(resolve(import.meta.dirname, 'debug-scripts')),
    thumbnailsPlugin(resolve(import.meta.dirname, 'public/images/generated')),
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    open: shouldOpenBrowser(process.env, process.stdout.isTTY),
  },
})
