/**
 * Vite plugin for the dev build's room effects panel: takes the volumes the
 * panel sets (a PUT of the whole file to `EFFECT_VOLUMES_URL`) and writes
 * them to `src/lantern/effectVolumes.json`, so the next run starts there and
 * the production build plays by them. Writing the file reloads nothing in the
 * running game, which has the volumes already; the next page load reads the
 * file fresh. It applies to the dev server only.
 */
import { writeFileSync } from 'node:fs'
import type { Plugin } from 'vite'
import {
  EFFECT_VOLUMES_URL,
  isEffectVolumes,
  type EffectVolumes,
} from './src/lantern/effectVolumes'

/** The largest request body taken, in bytes: far more than every room's volumes. */
const MAX_BODY_BYTES = 64 * 1024

/** `volumes` with rooms and effects in alphabetical order, so the file's diffs stay small. */
function sorted(volumes: EffectVolumes): EffectVolumes {
  return Object.fromEntries(
    Object.keys(volumes)
      .sort()
      .map((track) => [
        track,
        Object.fromEntries(
          Object.keys(volumes[track])
            .sort()
            .map((id) => [id, volumes[track][id]]),
        ),
      ]),
  )
}

/** Writes `body` to `file` when it is well-formed volumes; false, leaving the file, when not. */
export function writeEffectVolumes(file: string, body: unknown): boolean {
  if (!isEffectVolumes(body)) return false
  writeFileSync(file, JSON.stringify(sorted(body), null, 2) + '\n')
  return true
}

/** A dev-server endpoint saving the effect volumes to `file`. */
export function effectVolumesPlugin(file: string): Plugin {
  return {
    name: 'retroquest-effect-volumes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(EFFECT_VOLUMES_URL, (req, res) => {
        if (req.method !== 'PUT') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString('utf8')
          if (body.length > MAX_BODY_BYTES) req.destroy()
        })
        req.on('end', () => {
          let parsed: unknown = null
          try {
            parsed = JSON.parse(body)
          } catch {
            // Not JSON: refused below.
          }
          res.statusCode = writeEffectVolumes(file, parsed) ? 204 : 400
          res.end()
        })
      })
    },
    handleHotUpdate({ file: changed, modules, server }) {
      if (changed !== file) return undefined
      for (const module of modules) server.moduleGraph.invalidateModule(module)
      return []
    },
  }
}
