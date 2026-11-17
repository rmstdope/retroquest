import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  GAME_FULL_NAME,
  GAME_NAME,
  GAME_NAME_EYEBROW,
  GAME_NAME_WORDMARK,
  GAME_SUBTITLE,
} from '@/engine'

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

/** Every non-test source file under web/src, as path and text. */
function sources(dir: URL = new URL('../', import.meta.url)): string[][] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
    if (entry.isDirectory()) return sources(child)
    if (!/\.(ts|vue)$/.test(entry.name) || /\.test\.ts$/.test(entry.name))
      return []
    return [[entry.name, readFileSync(child, 'utf8')]]
  })
}

describe('the name of the game and of its land', () => {
  it('names the browser tab and the installed app', () => {
    const html = read('../../index.html')
    expect(html).toContain(`<title>${GAME_FULL_NAME}</title>`)
    expect(html).toContain(
      `name="apple-mobile-web-app-title" content="${GAME_NAME}"`,
    )
    const manifest = JSON.parse(read('../../public/manifest.json')) as {
      name: string
      short_name: string
    }
    expect(manifest.name).toBe(GAME_FULL_NAME)
    expect(manifest.short_name).toBe(GAME_NAME)
  })

  it('never writes RetroQuest or Eldoria in the game, only in storage keys', () => {
    const names = sources().filter(([, text]) =>
      /RetroQuest|Eldoria/.test(text),
    )
    expect(names.map(([name]) => name)).toEqual([])
  })

  it('writes the name once, in engine/gameName.ts', () => {
    const copies = sources().filter(
      ([name, text]) =>
        name !== 'gameName.ts' && text.replace(/\s+/g, ' ').includes(GAME_NAME),
    )
    expect(copies.map(([name]) => name)).toEqual([])
  })

  it('writes no part of the name or its subtitle into a screen', () => {
    // Twinmoor and the Wardens of the Dawn are also the land and the order
    // in the story, so only the screens (Vue components) are held to this.
    const screens = sources().filter(([name]) => name.endsWith('.vue'))
    for (const text of [GAME_NAME_EYEBROW, GAME_NAME_WORDMARK, GAME_SUBTITLE]) {
      const copies = screens.filter(([, source]) => source.includes(text))
      expect(copies.map(([name]) => name)).toEqual([])
    }
  })
})
