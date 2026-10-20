/**
 * Vite plugin for the dev-only `debug <name>` command: serves the script
 * files in `debug-scripts/` at `/debug-scripts/<name>.txt` so a script can be
 * edited without rebuilding. It applies to the dev server only; the folder is
 * not part of `public/`, so nothing of it reaches a production build.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

const URL_PREFIX = '/debug-scripts/'
const FILE_PATTERN = /^[a-z0-9_-]+\.txt$/

/** The text of `file` in `dir`, or null when the name is unsafe or the file is missing. */
export function readDebugScript(dir: string, file: string): string | null {
  if (!FILE_PATTERN.test(file)) return null
  const path = join(dir, file)
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

/** A dev-server middleware serving the scripts of `dir`. */
export function debugScriptsPlugin(dir: string): Plugin {
  return {
    name: 'retroquest-debug-scripts',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(URL_PREFIX, (req, res) => {
        const file = (req.url ?? '').split('?')[0].replace(/^\//, '')
        const text = readDebugScript(dir, file)
        res.statusCode = text === null ? 404 : 200
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(text ?? 'No such debug script')
      })
    },
  }
}
