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

  it('records every line in the voice cast for its speaker', () => {
    const manifest = JSON.parse(
      readFileSync(new URL(`act${act}/manifest.json`, AUDIO), 'utf8'),
    ) as NarrationManifest
    for (const line of script)
      expect(manifest[line.key]?.speaker).toBe(line.speaker)
  })
})

describe('the key-scene directions', () => {
  it('number 25 across Acts II to IV', () => {
    const total = [2, 3, 4].reduce(
      (sum, act) =>
        sum +
        Object.keys(read<Record<string, string>>(act, 'cues.json')).length,
      0,
    )
    expect(total).toBe(25)
  })
})

describe('returning speakers', () => {
  it.each(RETURNING)('%s has the same voice in every act', (speaker) => {
    expect(new Set(voicesOf(speaker)).size).toBeLessThanOrEqual(1)
  })
})
