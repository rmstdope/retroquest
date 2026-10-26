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
import { actLoops, questStingers, type MusicTrack } from './musicLists'

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
  it('lists one loop per act, named after the track it plays today', () => {
    const titles = ACTS.map((act) => actLoops(act).map((t) => t.title))
    expect(titles).toEqual([
      ['Market'],
      ['Medieval Village'],
      ['Feel The Storm'],
      ['The Silver Grail'],
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

  it('points at a music file the game really has', () => {
    for (const act of ACTS) {
      expect(
        existsSync(repoUrl(`web/public/audio/music/${act.musicFile}`)),
      ).toBe(true)
    }
  })

  it('lists nothing for an act without music', () => {
    expect(actLoops({ musicFile: '' })).toEqual([])
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

  it('has ids unique across the whole game', () => {
    const ids = [...ACTS.flatMap(actLoops), ...questStingers()].map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('the committed lists', () => {
  it.each([1, 2, 3, 4])('tts/act%i/music.json is what the game lists', (n) => {
    expect(readJson<MusicTrack[]>(`tts/act${n}/music.json`)).toEqual(
      actLoops(ACTS[n - 1] as Act),
    )
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
