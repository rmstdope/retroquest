import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { NarrationManifest } from './narrationManifest'

/** The recording tools' files for an act (`tts/act<N>/`), read from the repository. */
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

/** Speakers who return across acts and must keep their voice. */
const RETURNING = [
  'narrator',
  'mira',
  'elior',
  'mother',
  'father',
  'grandmother',
  'sir cedric',
  'nyx',
  'malakar',
  'knight of despair',
]

/** The voice a speaker has in each act that casts them. */
function voicesOf(speaker: string): string[] {
  return [1, 2, 3, 4].flatMap((act) => {
    const voice = read<Cast>(act, 'cast.json').speakers[speaker]?.voice
    return voice ? [voice] : []
  })
}

describe.each([2, 3, 4])('the recordings of Act %i', (act) => {
  const script = read<Line[]>(act, 'script.json')
  const cast = read<Cast>(act, 'cast.json')
  const cues = read<Record<string, string>>(act, 'cues.json')

  it('casts every speaker of its script', () => {
    const uncast = [...new Set(script.map((line) => line.speaker))].filter(
      (speaker) => !cast.speakers[speaker],
    )
    expect(uncast).toEqual([])
  })

  it('gives every key-scene direction to a line of the script', () => {
    const keys = new Set(script.map((line) => line.key))
    expect(Object.keys(cues).filter((key) => !keys.has(key))).toEqual([])
  })

  it('says the act’s title in words', () => {
    const numeral = ['', '', 'II', 'III', 'IV'][act]
    expect(cast.pronounce[`Act ${numeral}:`]).toMatch(/^Act \w+:$/)
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

describe('the key-scene directions', () => {
  it('number 29 lines for the 25 scenes across Acts II to IV', () => {
    const total = [2, 3, 4].reduce(
      (sum, act) =>
        sum +
        Object.keys(read<Record<string, string>>(act, 'cues.json')).length,
      0,
    )
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
    for (const act of [2, 3, 4]) {
      const { speakers } = read<Cast>(act, 'cast.json')
      if (speakers[alias])
        expect(speakers[alias].voice).toBe(
          speakers[base]?.voice ?? voicesOf(base)[0],
        )
    }
  })
})

describe('returning speakers', () => {
  it.each(RETURNING)('%s has the same voice in every act', (speaker) => {
    expect(new Set(voicesOf(speaker)).size).toBeLessThanOrEqual(1)
  })
})
