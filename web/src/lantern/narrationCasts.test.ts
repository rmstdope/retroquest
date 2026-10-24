import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { NarrationManifest } from './narrationManifest'

/**
 * The recording tools' files, read from the repository: one cast for the whole game
 * (`tts/cast.json`, Audio Studio's), and each act's script and key-scene directions
 * (`tts/act<N>/`).
 */
const TTS = new URL('../../../tts/', import.meta.url)
const AUDIO = new URL('../../public/audio/narration/', import.meta.url)

interface Cast {
  speakers: Record<string, { voice: string; style: string }>
  pronounce: Record<string, string>
}
interface Line {
  key: string
  speaker: string
  text: string
}

/** Read one JSON file of an act's recording tools. */
function read<T>(act: number, file: string): T {
  return JSON.parse(
    readFileSync(new URL(`act${act}/${file}`, TTS), 'utf8'),
  ) as T
}

/** The one cast: a speaker has one voice and manner in every act. */
const CAST = JSON.parse(readFileSync(new URL('cast.json', TTS), 'utf8')) as Cast

/** The mother's manner in Act III, kept as a direction on each of her lines there. */
const MOTHER_IN_ACT_III = '[tender, steady, afraid for a friend]'

describe.each([1, 2, 3, 4])('the recordings of Act %i', (act) => {
  const script = read<Line[]>(act, 'script.json')
  const cues = read<Record<string, string>>(act, 'cues.json')

  it('casts every speaker of its script', () => {
    const uncast = [...new Set(script.map((line) => line.speaker))].filter(
      (speaker) => !CAST.speakers[speaker],
    )
    expect(uncast).toEqual([])
  })

  it('gives every key-scene direction to a line of the script', () => {
    const keys = new Set(script.map((line) => line.key))
    expect(Object.keys(cues).filter((key) => !keys.has(key))).toEqual([])
  })

  it('says the act’s title in words', () => {
    const numeral = ['', 'I', 'II', 'III', 'IV'][act]
    expect(CAST.pronounce[`Act ${numeral}:`]).toMatch(/^Act \w+:$/)
    expect(CAST.pronounce[`Act ${numeral} complete.`]).toMatch(
      /^Act \w+ complete\.$/,
    )
  })

  it('has a clip on disk for every line and none for a line that left the script', () => {
    const manifestFile = new URL(`act${act}/manifest.json`, AUDIO)
    expect(existsSync(manifestFile)).toBe(true)
    const manifest = JSON.parse(
      readFileSync(manifestFile, 'utf8'),
    ) as NarrationManifest
    expect(Object.keys(manifest).sort()).toEqual(
      script.map((line) => line.key).sort(),
    )
    for (const clip of Object.values(manifest))
      expect(existsSync(new URL(`act${act}/${clip.file}`, AUDIO))).toBe(true)
  })

  it('records every line for its speaker', () => {
    const manifest = JSON.parse(
      readFileSync(new URL(`act${act}/manifest.json`, AUDIO), 'utf8'),
    ) as NarrationManifest
    for (const line of script)
      expect(manifest[line.key]?.speaker).toBe(line.speaker)
  })
})

describe('lines the engine picks at random', () => {
  it('has every one of the four phantom whispers in the Act III script', () => {
    const openings = [
      'The phantoms turn toward you',
      'A low murmur ripples through the ghostly figures',
      'The phantoms drift closer',
      'Spectral lips move in silent prayer',
    ]
    const script = read<Line[]>(3, 'script.json')
    for (const opening of openings)
      expect(script.some((line) => line.text.startsWith(opening))).toBe(true)
  })
})

/** The key-scene directions of an act: its cues, without the mother's Act III manner. */
function keyScenes(act: number): string[] {
  const cues = read<Record<string, string>>(act, 'cues.json')
  return Object.keys(cues).filter((key) => cues[key] !== MOTHER_IN_ACT_III)
}

describe('the key-scene directions', () => {
  it('number 29 lines for the 25 scenes across Acts II to IV', () => {
    const total = [2, 3, 4].reduce((sum, act) => sum + keyScenes(act).length, 0)
    // 25 scenes; "You. / Me." is two lines, King Alden's "Go home" three, the
    // Charred Notebook's softer reading two.
    expect(total).toBe(29)
  })
})

/** Speakers who are another speaker's voice in a scene: they must carry that voice's id. */
const SAME_VOICE: Record<string, string> = {
  'true self': 'elior',
  'shadow of the past': 'malakar',
  'an echo': 'malakar',
  aren: 'father',
  lysa: 'mother',
  "a man's voice, steady": 'father',
  'the steady voice': 'father',
  'a second man, quick and low': 'malakar',
  'the second man': 'malakar',
  "a woman's voice, hoarse": 'mother',
  'redeemed knight': 'knight of despair',
  'unmasked sorceress': 'sorceress of lies',
  'freed servants': 'trapped servants',
  lyria: 'master healer lyria',
  'oldest miner': 'miners',
}

describe('speakers who share a voice', () => {
  it.each(Object.entries(SAME_VOICE))('%s is %s’s voice', (alias, base) => {
    expect(CAST.speakers[base]?.voice).toMatch(/^[0-9a-f]{32}$/)
    expect(CAST.speakers[alias]?.voice).toBe(CAST.speakers[base]?.voice)
  })
})

describe('the one cast', () => {
  it('keeps the mother’s Act III manner on each of her lines there', () => {
    const cues = read<Record<string, string>>(3, 'cues.json')
    const hers = read<Line[]>(3, 'script.json').filter(
      (line) => line.speaker === 'mother',
    )
    // A key-scene direction of her own replaces the manner; every other line carries it.
    expect(hers.filter((line) => !cues[line.key])).toEqual([])
    expect(hers.some((line) => cues[line.key] === MOTHER_IN_ACT_III)).toBe(true)
  })
})
