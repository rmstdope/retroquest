/**
 * Coverage of the recorded narration: the script of each act (`tts/act<N>/script.json`)
 * holds the lines a player reaches only through an optional moment, and each
 * optional line is voiced by its speaker once recorded. A line with no recording
 * yet is not a defect: the navigator records new lines by hand after the merge.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { NarrationManifest } from './narrationManifest'
import type { ScriptLine } from './narrationScript'

/** Reads a JSON file of the repository relative to `web/`. */
function readJson<T>(path: string): T {
  return JSON.parse(
    readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'),
  ) as T
}

/** Optional lines per act: each is spoken by `speaker` and begins with `opening`. */
const OPTIONAL_LINES: Record<number, { speaker: string; opening: string }[]> = {
  2: [{ speaker: 'families', opening: "She's smiling. First time in a week." }],
  3: [
    { speaker: 'phoenix', opening: 'You gave him back his place' },
    { speaker: 'lead miner', opening: 'Thank you, Elior.' },
    { speaker: 'mira', opening: 'Thank you. I did not dare ask for that' },
    { speaker: 'mira', opening: 'I should have. I chose the seal' },
    { speaker: 'pier warden', opening: 'Keep it. Toll for the crossing' },
    { speaker: 'pier warden', opening: 'I said keep it, lad.' },
    { speaker: 'pier warden', opening: '… Aye. I think I knew it' },
    {
      speaker: 'ancient dragon',
      opening: 'You said you would return what you took',
    },
    { speaker: 'ancient dragon', opening: 'Go with my blessing, young one' },
  ],
  4: [
    { speaker: 'king alden', opening: 'You came for me. Whoever you are' },
    { speaker: 'lysa', opening: 'We saw you at the workbench with us' },
    { speaker: 'malakar', opening: 'You saw. Then you know I was not lying' },
    { speaker: 'sir cedric', opening: 'If they can be let go, so can this' },
    {
      speaker: 'captain of the guard',
      opening: "'Then I will tell them at home",
    },
    { speaker: 'true self', opening: 'Remember what you told me' },
    {
      speaker: 'malakar',
      opening: 'And not for the first time, I think. You have shown mercy',
    },
  ],
}

describe.each([2, 3, 4])('narration coverage of Act %i', (act) => {
  const script = readJson<ScriptLine[]>(`tts/act${act}/script.json`)
  const manifest = readJson<NarrationManifest>(
    `web/public/audio/narration/act${act}/manifest.json`,
  )

  it.each(OPTIONAL_LINES[act].map((line) => [line.opening, line] as const))(
    'voices the optional line "%s" in its speaker\'s voice',
    (_opening, expected) => {
      const line = script.find((entry) =>
        entry.text.startsWith(expected.opening),
      )
      expect(line?.speaker).toBe(expected.speaker)
      const clip = manifest[line?.key ?? '']
      // A line with no recording yet is not a defect; a recorded one has its speaker's voice.
      if (clip) expect(clip.speaker).toBe(expected.speaker)
    },
  )
})

/** The replies to resting that are read aloud: the everyday one in every act, and the special ones where a room gives them. */
const REST_LINES: Record<number, string[]> = {
  1: [
    'You rest for a moment, gathering your strength.',
    'You are asleep already. The voice says your name again, nearer.',
    'You rest for a while, but the glade remains quiet. Perhaps something more needs to happen for its magic to awaken.',
    'You take a moment to rest in the tranquil glade. The Deer continues to graze peacefully.',
  ],
  2: ['You rest for a moment, gathering your strength.'],
  3: [
    'You rest for a moment, gathering your strength.',
    'The heat of the crater soaks into you, and the ache goes out of your legs.',
    'The vents exhale. A scalding gust roars up out of the southern tunnel.',
    'The vents fall still, holding their breath. The heat hangs heavy and unmoving.',
    'The vents draw in. A cool draught tugs past you toward the south.',
  ],
  4: [
    'You rest for a moment, gathering your strength.',
    'You sit down among the orbs and wait, and say nothing at all. The Shadow watches you do it for a long time.',
  ],
}

describe.each([1, 2, 3, 4])('narration of resting in Act %i', (act) => {
  const script = readJson<ScriptLine[]>(`tts/act${act}/script.json`)

  it.each(REST_LINES[act])('has the narrator read "%s"', (words) => {
    expect(script.find((entry) => entry.text === words)?.speaker).toBe(
      'narrator',
    )
  })
})
