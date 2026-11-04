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
  ROOM_AMBIENCE,
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
  const act = new Act1()
  const roomTracks = Object.keys(act.rooms).map((key) =>
    roomTrackId(act.name, key),
  )
  const clips = new Map(GAME_EFFECTS.map((clip) => [clip.id, clip]))
  const placements = Object.entries(ROOM_AMBIENCE).flatMap(([track, effects]) =>
    effects.map((effect) => ({ track, ...effect })),
  )

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

  it('rings the shop bell once, as the General Store is entered', () => {
    expect(ambienceAt(roomTrackId('Act1', 'GeneralStore'))).toContainEqual({
      id: 'shop-bell',
      loops: false,
      afterSeconds: 1.5,
    })
  })

  it('plays one clip in several rooms, each at its own pace', () => {
    for (const key of ['AbandonedShed', 'OldMill', 'VillageChapel'])
      expect(
        ambienceAt(roomTrackId('Act1', key)).map((effect) => effect.id),
      ).toContain('wood-creak')
  })

  it('plays nothing where no effect is listed', () => {
    expect(ambienceAt('market')).toEqual([])
    expect(ambienceAt('')).toEqual([])
  })

  it('plays effects only on the tracks of real rooms', () => {
    for (const track of Object.keys(ROOM_AMBIENCE))
      expect(roomTracks).toContain(track)
  })

  it('plays only listed clips, a loop round and round and a one-shot not', () => {
    for (const placement of placements) {
      const clip = clips.get(placement.id)
      expect(clip, placement.id).toBeDefined()
      expect(placement.loops, placement.id).toBe(clip?.loops === true)
    }
  })

  it('plays every listed clip somewhere', () => {
    const played = new Set(placements.map((placement) => placement.id))
    for (const clip of GAME_EFFECTS) expect(played).toContain(clip.id)
  })

  it('plays a clip at most once in a room', () => {
    for (const effects of Object.values(ROOM_AMBIENCE)) {
      const ids = effects.map((effect) => effect.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('gives every wait a positive length, the shortest no longer than the longest', () => {
    for (const placement of placements) {
      if ('everySeconds' in placement) {
        const [min, max] = placement.everySeconds
        expect(min).toBeGreaterThan(0)
        expect(max).toBeGreaterThanOrEqual(min)
      }
      if ('afterSeconds' in placement)
        expect(placement.afterSeconds).toBeGreaterThanOrEqual(0)
    }
  })
})
