import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { NarrationManifest } from './narrationManifest'

/**
 * The recording tools' files, read from the repository: each act's script
 * (`tts/act<N>/script.json`, the game's), and Content Studio's own: one cast for the
 * whole game (`content-studio/narration/cast.json`) and each act's key-scene
 * directions (`content-studio/narration/act<N>.edits.json`).
 */
const TTS = new URL('../../../tts/', import.meta.url)
const NARRATION = new URL('../../../content-studio/narration/', import.meta.url)
const AUDIO = new URL('../../public/audio/narration/', import.meta.url)

interface Cast {
  speakers: Record<string, { voice: string; style: string }>
  pronounce: Record<string, Record<string, string>>
}
interface Line {
  id: string
  speaker: string
  text: string
}

/** Read one JSON file of an act's recording tools. */
function read<T>(act: number, file: string): T {
  return JSON.parse(
    readFileSync(new URL(`act${act}/${file}`, TTS), 'utf8'),
  ) as T
}

/** The key-scene directions of an act by line id (the `cues` of its edits file). */
function cuesOf(act: number): Record<string, string> {
  return (
    JSON.parse(
      readFileSync(new URL(`act${act}.edits.json`, NARRATION), 'utf8'),
    ) as { cues: Record<string, string> }
  ).cues
}

/** The one cast: a speaker has one voice and manner in every act. */
const CAST = JSON.parse(
  readFileSync(new URL('cast.json', NARRATION), 'utf8'),
) as Cast

/** How the English lines say words that are not said as they are written. */
const PRONOUNCE = CAST.pronounce.en ?? {}

/** The mother's manner in Act III, kept as a direction on each of her lines there. */
const MOTHER_IN_ACT_III = '[tender, steady, afraid for a friend]'

describe.each([1, 2, 3, 4])('the recordings of Act %i', (act) => {
  const script = read<Line[]>(act, 'script.json')
  const cues = cuesOf(act)

  it('has a cast, heading, directions, pronunciations and clips that all fit its script', () => {
    const problems: string[] = []
    const keys = new Set(script.map((line) => line.id))
    const numeral = ['', 'I', 'II', 'III', 'IV'][act]
    const title = [
      '',
      'The Call to Adventure',
      'The Gathering Storm',
      'Trials and Revelations',
      'The Final Confrontation',
    ][act]

    for (const speaker of new Set(script.map((line) => line.speaker)))
      if (!CAST.speakers[speaker]) problems.push(`speaker not cast: ${speaker}`)
    if (
      !script.some((line) => line.text === `Act ${numeral} complete. ${title}.`)
    )
      problems.push('the act-complete heading is missing from the script')
    for (const key of Object.keys(cues))
      if (!keys.has(key))
        problems.push(`direction for a line not in script: ${key}`)
    if (!/^Act \w+:$/.test(PRONOUNCE[`Act ${numeral}:`] ?? ''))
      problems.push(`no pronunciation of "Act ${numeral}:" in words`)
    if (
      !/^Act \w+ complete\.$/.test(PRONOUNCE[`Act ${numeral} complete.`] ?? '')
    )
      problems.push(`no pronunciation of "Act ${numeral} complete." in words`)

    const manifestFile = new URL(`act${act}/manifest.json`, AUDIO)
    if (!existsSync(manifestFile)) {
      problems.push('manifest.json is missing')
    } else {
      const manifest = JSON.parse(
        readFileSync(manifestFile, 'utf8'),
      ) as NarrationManifest
      // A line with no recording yet is not a defect; a clip with no line is.
      for (const [key, clip] of Object.entries(manifest)) {
        if (!keys.has(key))
          problems.push(`clip for a line not in script: ${key}`)
        if (!existsSync(new URL(`act${act}/${clip.file}`, AUDIO)))
          problems.push(`clip file missing on disk: ${clip.file}`)
      }
      for (const line of script)
        if (manifest[line.id] && manifest[line.id]?.speaker !== line.speaker)
          problems.push(`clip in the wrong voice: ${line.id}`)
    }
    expect(problems).toEqual([])
  })
})

describe('the closing line of Act III', () => {
  it('is in the script', () => {
    const script = read<Line[]>(3, 'script.json')
    expect(script.map((line) => line.text)).toContain(
      "Your parents were Malakar's closest friends. " +
        'The Dragon says they are warded away, not dead.',
    )
  })
})

describe("Elior's journal in the Act I script", () => {
  it('is four lines, all in Elior’s voice', () => {
    const script = read<Line[]>(1, 'script.json')
    const openings = [
      'The storm kept me up half the night.',
      'When I slept, I dreamed.',
      'I knew that voice.',
      'When I woke, the tune was still going.',
    ]
    for (const opening of openings) {
      const line = script.find((entry) => entry.text.startsWith(opening))
      expect(line?.speaker).toBe('elior')
    }
  })
})

describe('lines the engine picks at random', () => {
  it('has every one of the four phantom whispers in the Act III script', () => {
    const openings = [
      'The phantoms turn toward you',
      'One of the phantoms stops in front of you',
      'The phantoms drift closer',
      'One of the phantoms reaches for a door',
    ]
    const script = read<Line[]>(3, 'script.json')
    for (const opening of openings)
      expect(script.some((line) => line.text.startsWith(opening))).toBe(true)
  })
})

/** The key-scene directions of an act: its cues, without the mother's Act III manner. */
function keyScenes(act: number): string[] {
  const cues = cuesOf(act)
  return Object.keys(cues).filter((key) => cues[key] !== MOTHER_IN_ACT_III)
}

describe('the key-scene directions', () => {
  it('number 32 lines for the 25 scenes across Acts II to IV', () => {
    const total = [2, 3, 4].reduce((sum, act) => sum + keyScenes(act).length, 0)
    // 25 scenes; "You. / Me." is two lines, King Alden's "Go home" three, the
    // Charred Notebook's softer reading two. Three optional lines take their
    // scene's manner: the dragon's two after the sigils, Malakar's after the Bargain.
    expect(total).toBe(32)
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
    const cues = cuesOf(3)
    const hers = read<Line[]>(3, 'script.json').filter(
      (line) => line.speaker === 'mother',
    )
    // A key-scene direction of her own replaces the manner; every other line carries it.
    expect(hers.filter((line) => !cues[line.id])).toEqual([])
    expect(hers.some((line) => cues[line.id] === MOTHER_IN_ACT_III)).toBe(true)
  })
})
