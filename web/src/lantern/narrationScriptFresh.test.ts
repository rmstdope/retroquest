import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '@/act1/Act1'
import { ACT1_GOLDEN_PATH } from '@/act1/Act1GoldenPath'
import { pathIndex } from '@/testing/gameHelpers'
import { FLAG_VEGETABLE_FIELD_WATERED } from '@/act1/Act1StoryFlags'
import { narrationKey } from './narrationKey'
import {
  linesOfTurn,
  type ScriptLine,
  type WriterRule,
} from './narrationScript'
import {
  ACT_NUMBERS,
  LONG_ACT_NUMBERS,
  extractActImages,
  extractActMusic,
  extractActScenes,
  extractActScript,
} from '../../../tts/actScripts'

/**
 * Acts 2 and 3 play for seconds each; `narrationScriptFreshLong.test.ts`
 * checks their scripts so that the two files run side by side.
 */
const SLOW = 120_000

/** The acts whose script this file checks; the long acts have their own file. */
const SHORT_ACTS = ACT_NUMBERS.filter(
  (number) => !LONG_ACT_NUMBERS.includes(number),
)

/** Reads a committed JSON file of an act under `tts/act<N>/`. */
function committed(number: string, file: string): unknown {
  return JSON.parse(
    readFileSync(
      new URL(`../../../tts/act${number}/${file}`, import.meta.url),
      'utf8',
    ),
  )
}

/**
 * The committed narration script, music, image and scene lists of each act are what the
 * extractor would write now. A change to what the game says that leaves them
 * behind fails here; regenerate with `tts/extract-act.ts <N>`.
 */
describe('committed narration files are current', () => {
  it(
    'every short act script.json is what extract-act.ts writes',
    () => {
      const stale = SHORT_ACTS.filter(
        (number) =>
          JSON.stringify(extractActScript(number)) !==
          JSON.stringify(committed(number, 'script.json')),
      ).map((number) => `tts/act${number}/script.json`)
      expect(stale).toEqual([])
    },
    SLOW,
  )
  it.each([
    ['music.json', extractActMusic],
    ['images.json', extractActImages],
    ['scenes.json', extractActScenes],
  ] as const)('every act %s is what extract-act.ts writes', (file, extract) => {
    const stale = ACT_NUMBERS.filter(
      (number) =>
        JSON.stringify(extract(number)) !==
        JSON.stringify(committed(number, file)),
    ).map((number) => `tts/act${number}/${file}`)
    expect(stale).toEqual([])
  })
})

/** Lines a player reaches only off the golden path must be in the script, so they can be recorded. */
describe('Act I off-path lines are in the narration script', () => {
  const texts = (committed('1', 'script.json') as { text: string }[]).map(
    (line) => line.text,
  )
  it('has every off-path line', () => {
    const wanted = [
      'Talk to me while I work, dear. I do like to hear you talk.',
      'Nothing here answers to that. The voice says your name.',
      'You put a hand to the gears. They turn under it and keep turning; fingers will not stop them.',
      "You can't unlock a person!",
      "The truth about what, love? You've lost me.",
      // Tilda's later rumours, told only when she is talked to again.
      "The animals are restless. My neighbor's dog howled at nothing for hours, and the " +
        'chickens refuse to leave their coop after dusk. ' +
        "Malakar's weather, my mother would have called it, and knocked on wood.",
      "Somebody's been down at the river bend. Good boots, not from round " +
        "here. The prints go right to the water's edge and just stand there, " +
        'my cousin says, like he waited a long while.',
      'Did you know the chapel bell rang once by itself? Years back, at ' +
        'midnight, with no hand on the rope. My mother knocked on wood for ' +
        'a week.',
      "They say the king's taken to his bed in Greendale, and not one " +
        "physician can name what ails him. And the flour cart didn't come " +
        "Thursday. Eleven years, and it's never once missed a Thursday.",
      // Mira, once the fox kit is freed off the path.
      'A fox kit came past my door this morning with a bit of snare wire ' +
        'still round its leg. I took it off.',
      'She glances at you.',
      // Borin, once Elior has learned magic for real.
      'Magic, eh? Word gets round, young Elior. ' +
        "Can't hammer that into shape, but I'd wager it wants the same " +
        'as iron: patience, and a steady hand.',
    ]
    expect(wanted.filter((text) => !texts.includes(text))).toEqual([])
  })

  it('has the Vegetable Field as watering it leaves it', () => {
    const state = new Game([new Act1()]).state
    const field = state.allRooms.VegetableField
    state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    const watered = linesOfTurn(field.descriptionFor(state), [])
    expect(watered.length).toBeGreaterThan(0)
    for (const line of watered) expect(texts).toContain(line.text)
  })

  it('has the fisherman saying his lines as he greets Elior without the rod', () => {
    const script = committed('1', 'script.json') as ScriptLine[]
    const lines = [
      "River's off this season. Fish are sulking, and this arm's gone stiff " +
        "on me, so I couldn't land one if they weren't.",
      "I'd give a good deal for a fresh fish.",
    ]
    const missing = lines.filter(
      (text) =>
        !script.some(
          (line) =>
            line.id === narrationKey('fisherman', text) &&
            line.speaker === 'fisherman' &&
            line.text === text,
        ),
    )
    expect(missing).toEqual([])
  })

  it('has Elior saying what he says on the picture', () => {
    const script = committed('1', 'script.json') as ScriptLine[]
    const missing = ['truth', 'stay', 'hello'].filter(
      (words) =>
        !script.some(
          (line) =>
            line.id === narrationKey('elior', words) &&
            line.speaker === 'elior' &&
            line.text === words,
        ),
    )
    expect(missing).toEqual([])
  })
})

/**
 * Hemlock keeps the General Store shut until Patches is home, and the golden
 * path only reaches the store with her in Elior's arms; every line the shut
 * store can show must still be in the script, so it can be recorded.
 */
describe('Act I shut General Store lines are in the narration script', () => {
  it('has every line Hemlock and the narrator say before Patches is home', () => {
    const script = committed('1', 'script.json') as { id: string }[]
    const keys = new Set(script.map((line) => line.id))
    const writers = committed('1', 'writers.json') as WriterRule[]
    const play = new GameController(new Game([new Act1()]))
    play.advanceToRunning()
    const inSquare = pathIndex(ACT1_GOLDEN_PATH, 'take bucket')
    for (const command of ACT1_GOLDEN_PATH.slice(0, inSquare))
      play.takeTurn(command)
    expect(play.getRoomName()).toBe('Village Square')

    const answers = [
      'go east',
      'talk to shopkeeper',
      'talk to shopkeeper',
      'buy rope from shopkeeper',
    ].map((command) => play.takeTurn(command))
    expect(play.getRoomName()).toBe('General Store')
    const missing = answers
      .flatMap((answer) => linesOfTurn(answer, writers))
      .filter((line) => !keys.has(line.id))
      .map((line) => `${line.speaker}: ${line.text}`)
    expect(missing).toEqual([])
  })
})
