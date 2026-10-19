import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { LANTERN_PALETTES } from './tokens'

// Lantern's page background; tokens.test.ts keeps lantern.css in step with it.
const dark = LANTERN_PALETTES.dark.bg
const light = LANTERN_PALETTES.light.bg

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

describe('browser theme colour', () => {
  it('follows the device theme with Lantern backgrounds', () => {
    const html = read('../../index.html')
    const metas = [...html.matchAll(/<meta name="theme-color"([^>]*)>/g)].map(
      (m) => m[1],
    )

    expect(metas).toHaveLength(2)
    expect(metas).toContainEqual(
      expect.stringMatching(
        new RegExp(
          `media="\\(prefers-color-scheme: light\\)" content="${light}"`,
        ),
      ),
    )
    expect(metas).toContainEqual(
      expect.stringMatching(
        new RegExp(
          `media="\\(prefers-color-scheme: dark\\)" content="${dark}"`,
        ),
      ),
    )
  })

  it('uses the dark Lantern background for the installed app', () => {
    const manifest = JSON.parse(read('../../public/manifest.json'))

    expect(manifest.theme_color).toBe(dark)
    expect(manifest.background_color).toBe(dark)
  })
})
