/**
 * The game's track lists for Audio Studio: one loop per act, briefed after the
 * track the act plays today, and the two quest stingers. The committed lists in
 * `tts/` are what a refresh from the game writes, so they must equal these.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import type { Act } from '@/engine'
import { NEW_QUEST_FILE, QUEST_COMPLETE_FILE } from '@/composables/questSounds'
import {
  actLoopId,
  actLoops,
  questStingers,
  roomLoops,
  roomTrackId,
  type MusicTrack,
} from './musicLists'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ACTS: Act[] = [new Act1(), new Act2(), new Act3(), new Act4()]

/** Reads a path of the repository (relative to its root). */
function repoUrl(path: string): URL {
  return new URL(`../../../${path}`, import.meta.url)
}

/** Reads a JSON file of the repository. */
function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(repoUrl(path), 'utf8')) as T
}

describe('actLoops', () => {
  it('lists one loop per act, named by its act', () => {
    const titles = ACTS.map((act) => actLoops(act).map((t) => t.title))
    expect(titles).toEqual([
      ['Act 1 Opening'],
      ['Act 2 Opening'],
      ['Act 3 Opening'],
      ['Act 4 Opening'],
    ])
  })

  it('keeps the ids a chosen take is keyed by', () => {
    const ids = ACTS.map((act) => actLoops(act).map((t) => t.id))
    expect(ids).toEqual([
      ['market'],
      ['medieval-village'],
      ['feel-the-storm'],
      ['the-silver-grail'],
    ])
  })

  it('gives each loop a slug id, a place, a brief and a length', () => {
    for (const act of ACTS) {
      for (const track of actLoops(act)) {
        expect(track.id).toMatch(SLUG)
        expect(track.plays.length).toBeGreaterThan(0)
        expect(track.brief).toContain('instrumental')
        expect(track.seconds).toBeGreaterThan(10)
      }
    }
  })

  it("names the game's file, as a path inside the project root", () => {
    for (const act of ACTS) {
      const [track] = actLoops(act)
      expect(track?.file).toBe(`web/public/audio/music/${act.musicFile}`)
      expect(existsSync(repoUrl(track?.file ?? ''))).toBe(true)
    }
  })

  it('titles the loop of an act without a number by its name', () => {
    const [track] = actLoops({
      name: 'Epilogue',
      musicFile: 'Conquest - Market (freetouse.com).mp3',
    })
    expect(track?.title).toBe('Epilogue')
  })

  it('lists nothing for an act without music', () => {
    expect(actLoops({ name: 'Act5', musicFile: '' })).toEqual([])
  })
})

describe('actLoops without a brief', () => {
  it('refuses a music file it has no brief for', () => {
    expect(() =>
      actLoops({ name: 'Act5', musicFile: 'Someone - New Song.mp3' }),
    ).toThrow('No loop brief')
  })
})

describe('roomLoops', () => {
  it('lists every room of every act once, under a slug id', () => {
    for (const act of ACTS) {
      const tracks = roomLoops(act)
      expect(tracks.map((t) => t.id)).toEqual(
        Object.keys(act.rooms).map((key) => roomTrackId(act.name, key)),
      )
      for (const track of tracks) expect(track.id).toMatch(SLUG)
    }
  })

  it('names a room track after its act and room key', () => {
    expect(roomTrackId('Act1', 'VillageSquare')).toBe('act1-village-square')
  })

  it("briefs a room from its name and description, and plays no file of the game's", () => {
    const act = new Act1()
    const square = roomLoops(act).find((t) => t.id === 'act1-village-square')
    const room = act.rooms.VillageSquare
    expect(square?.title).toBe(room.name)
    expect(square?.plays).toBe(`Act I, ${room.name}`)
    expect(square?.brief).toContain(room.name)
    expect(square?.brief).toContain('instrumental')
    expect(square?.brief).not.toMatch(/\[\/?[a-z_]+\]/)
    expect(square?.file).toBeUndefined()
  })

  it('keeps every brief short enough to read in the studio', () => {
    for (const act of ACTS)
      for (const track of roomLoops(act))
        expect(track.brief.length).toBeLessThan(400)
  })
})

describe('actLoopId', () => {
  it('is the id of the act loop', () => {
    for (const act of ACTS)
      expect(actLoopId(act.musicFile)).toBe(actLoops(act)[0]?.id)
  })
})

describe('questStingers', () => {
  it('lists the new-quest and quest-complete sounds, at most 10 seconds each', () => {
    const stingers = questStingers()
    expect(stingers.map((s) => s.id)).toEqual(['new-quest', 'quest-complete'])
    for (const stinger of stingers) {
      expect(stinger.seconds).toBeLessThanOrEqual(10)
      expect(stinger.id).toMatch(SLUG)
    }
  })

  it('names the files the game plays', () => {
    for (const file of [NEW_QUEST_FILE, QUEST_COMPLETE_FILE]) {
      expect(existsSync(repoUrl(`web/public/audio/soundeffects/${file}`))).toBe(
        true,
      )
    }
    expect(questStingers().map((s) => s.plays)).toEqual([
      expect.stringContaining('new quest'),
      expect.stringContaining('quest is completed'),
    ])
  })

  it('names the files the game plays, as paths inside the project root', () => {
    const files = questStingers().map((s) => s.file)
    expect(files).toEqual([
      `web/public/audio/soundeffects/${NEW_QUEST_FILE}`,
      `web/public/audio/soundeffects/${QUEST_COMPLETE_FILE}`,
    ])
    for (const file of files) expect(existsSync(repoUrl(file ?? ''))).toBe(true)
  })

  it('has ids unique across the whole game', () => {
    const ids = [
      ...ACTS.flatMap(actLoops),
      ...ACTS.flatMap(roomLoops),
      ...questStingers(),
    ].map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('the committed lists', () => {
  it.each([1, 2, 3, 4])('tts/act%i/music.json is what the game lists', (n) => {
    expect(readJson<MusicTrack[]>(`tts/act${n}/music.json`)).toEqual([
      ...actLoops(ACTS[n - 1] as Act),
      ...roomLoops(ACTS[n - 1] as Act),
    ])
  })

  it('tts/stingers.json is what the game lists', () => {
    expect(readJson<MusicTrack[]>('tts/stingers.json')).toEqual(questStingers())
  })

  it('audio-studio.json declares the music paths and the shared refresh', () => {
    const project = readJson<{
      music: { refreshShared: string; paths: Record<string, string> }
    }>('audio-studio.json')
    expect(project.music.refreshShared).toContain('tts/extract-shared.ts')
    expect(project.music.paths).toEqual({
      loops: 'tts/{part}/music.json',
      stingers: 'tts/stingers.json',
      briefs: 'music/briefs.json',
      lock: 'music/music.lock.json',
      clips: 'web/public/audio/music/generated',
      manifest: 'web/public/audio/music/generated/manifest.json',
    })
  })
})
