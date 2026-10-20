import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { debugScriptsPlugin } from './debugScripts.config'
import { shouldOpenBrowser } from './devServerOpen.config'

export default defineConfig({
  plugins: [vue(), debugScriptsPlugin(resolve(__dirname, 'debug-scripts'))],
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
