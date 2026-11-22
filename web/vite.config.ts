import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { debugScriptsPlugin } from './debugScripts.config.ts'
import { thumbnailsPlugin } from './thumbnails.config.ts'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { shouldOpenBrowser } from './devServerOpen.config.ts'

/** The game's version as feedback reports carry it: the package's, with the commit when git knows it. */
function appVersion(): string {
  const { version } = JSON.parse(
    readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'),
  ) as { version: string }
  try {
    const sha = execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    return sha ? `${version}+${sha}` : version
  } catch {
    return version
  }
}

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(appVersion()) },
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
