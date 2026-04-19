import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { pythonSourcePlugin } from './vite-plugins/pythonSourcePlugin'

export default defineConfig({
  plugins: [
    vue(),
    pythonSourcePlugin({
      srcDir: resolve(__dirname, '..', 'src'),
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index-vue.html'),
    },
  },
  server: {
    open: '/index-vue.html',
  },
})
