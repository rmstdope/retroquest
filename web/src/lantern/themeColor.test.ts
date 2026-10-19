import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

/** Lantern's page background for the dark (default) and light themes. */
function lanternBackgrounds(): { dark: string; light: string } {
  const css = read('./lantern.css')
  const [dark, light] = [...css.matchAll(/--lq-bg:\s*(#[0-9a-f]{6})/gi)].map(
    (m) => m[1].toLowerCase(),
  )
  return { dark, light }
}

describe('browser theme colour', () => {
  it('follows the device theme with Lantern backgrounds', () => {
    const html = read('../../index.html')
    const metas = [...html.matchAll(/<meta name="theme-color"([^>]*)>/g)].map(
      (m) => m[1],
    )
    const { dark, light } = lanternBackgrounds()

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
    const { dark } = lanternBackgrounds()

    expect(manifest.theme_color).toBe(dark)
    expect(manifest.background_color).toBe(dark)
  })
})
