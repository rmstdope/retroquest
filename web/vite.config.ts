import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { debugScriptsPlugin } from './debugScripts.config'
import { thumbnailsPlugin } from './thumbnails.config'
import { shouldOpenBrowser } from './devServerOpen.config'

export default defineConfig({
  plugins: [
    vue(),
    debugScriptsPlugin(resolve(__dirname, 'debug-scripts')),
    thumbnailsPlugin(resolve(__dirname, 'public/images/generated')),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    open: shouldOpenBrowser(process.env, process.stdout.isTTY),
  },
})
