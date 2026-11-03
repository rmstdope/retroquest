/**
 * The game's sound effects for Content Studio, and where the game plays them:
 * the list in `tts/effects.json` is what a refresh from the game writes, so it
 * must equal `effectsList()`.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { roomTrackId } from './musicLists'
import {
  ambienceAt,
  effectsList,
  GAME_EFFECTS,
  type EffectEntry,
} from './effectLists'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DREAM_TRACK = roomTrackId('Act1', 'TheDream')

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

  it('gives the studio only its own fields: id, description, seconds and whether it loops', () => {
    for (const entry of effectsList()) {
      expect(Object.keys(entry).sort()).toEqual(
        entry.loops
          ? ['description', 'id', 'loops', 'seconds']
          : ['description', 'id', 'seconds'],
      )
      expect(entry.description.length).toBeGreaterThan(0)
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

  it('content-studio.json declares the effects paths and the refresh', () => {
    const project = readJson<{
      effects: { refresh: string; paths: Record<string, string> }
    }>('content-studio.json')
    expect(project.effects.refresh).toContain('tts/extract-effects.ts')
    expect(project.effects.paths).toEqual({
      list: 'tts/effects.json',
      lock: 'effects/effects.lock.json',
      clips: 'web/public/audio/soundeffects/generated',
      manifest: 'web/public/audio/soundeffects/generated/manifest.json',
    })
  })
})

describe('ambienceAt', () => {
  it('plays the rain round and round in The Dream', () => {
    expect(ambienceAt(DREAM_TRACK)).toContainEqual({
      id: 'rain',
      loops: true,
    })
  })

  it('strikes lightning in The Dream every 3 to 8 seconds', () => {
    expect(ambienceAt(DREAM_TRACK)).toContainEqual({
      id: 'lightning',
      loops: false,
      everySeconds: [3, 8],
    })
  })

  it('plays nothing where no effect is listed', () => {
    expect(ambienceAt(roomTrackId('Act1', 'EliorsCottage'))).toEqual([])
    expect(ambienceAt('')).toEqual([])
  })

  it('plays every effect on the track of a real room', () => {
    const act = new Act1()
    const tracks = Object.keys(act.rooms).map((key) =>
      roomTrackId(act.name, key),
    )
    for (const effect of GAME_EFFECTS) expect(tracks).toContain(effect.track)
  })

  it('gives every interval a shortest wait no longer than its longest', () => {
    for (const effect of GAME_EFFECTS)
      if ('everySeconds' in effect) {
        const [min, max] = effect.everySeconds
        expect(min).toBeGreaterThan(0)
        expect(max).toBeGreaterThanOrEqual(min)
      }
  })
})
