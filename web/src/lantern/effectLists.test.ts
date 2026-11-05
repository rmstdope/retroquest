/**
 * The game's sound effects for Content Studio: the list in `tts/effects.json` is what a refresh from the game writes, so it
 * must equal `effectsList()`.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { effectsList, type EffectEntry } from './effectLists'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Reads a JSON file of the repository (relative to its root). */
function readJson<T>(path: string): T {
  return JSON.parse(
    readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'),
  ) as T
}

describe('effectsList', () => {
  it('lists each effect once, under a slug id', () => {
    const ids = effectsList().map((effect) => effect.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(SLUG)
  })

  it('gives the studio only its own fields: id, text, seconds and whether it loops', () => {
    for (const entry of effectsList()) {
      expect(Object.keys(entry).sort()).toEqual(
        entry.loops
          ? ['id', 'loops', 'seconds', 'text']
          : ['id', 'seconds', 'text'],
      )
      expect(entry.text.length).toBeGreaterThan(0)
      expect(entry.seconds).toBeGreaterThan(0)
    }
  })

  it('marks the rain as looping and the lightning as playing once', () => {
    const byId = new Map(effectsList().map((entry) => [entry.id, entry]))
    expect(byId.get('rain')?.loops).toBe(true)
    expect(byId.get('lightning')?.loops).toBeUndefined()
  })

  it('tts/effects.json is what the game lists', () => {
    expect(readJson<EffectEntry[]>('tts/effects.json')).toEqual(effectsList())
  })

  it('content-studio.json declares the effects list, clips and manifest, and the refresh', () => {
    const project = readJson<{
      refresh: { shared: string }
      effects: Record<string, unknown>
    }>('content-studio.json')
    expect(project.refresh.shared).toContain('tts/extract-effects.ts')
    expect(project.effects).toEqual({
      from: { shared: 'tts/effects.json' },
      model: 'open-1',
      clips: 'web/public/audio/soundeffects/generated',
      manifest: 'web/public/audio/soundeffects/generated/manifest.json',
    })
  })
})
