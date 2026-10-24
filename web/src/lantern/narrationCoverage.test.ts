/**
 * Coverage of the recorded narration: the script of each act (`tts/act<N>/script.json`)
 * holds the lines a player reaches only through an optional moment, and every
 * line of the script has a clip in the act's shipped manifest, so none of them
 * plays silently.
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
    { speaker: 'pier warden', opening: '… Aye. I think I knew it' },
    {
      speaker: 'ancient dragon',
      opening: 'You said you would return what you took',
    },
    { speaker: 'ancient dragon', opening: 'Go with my blessing, young one' },
  ],
  4: [
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

  it('has a recording for every line of the script', () => {
    const missing = script.filter((line) => !manifest[line.key])
    expect(missing.map((line) => line.text.slice(0, 60))).toEqual([])
  })

  it.each(OPTIONAL_LINES[act].map((line) => [line.opening, line] as const))(
    'voices the optional line "%s" in its speaker\'s voice',
    (_opening, expected) => {
      const line = script.find((entry) =>
        entry.text.startsWith(expected.opening),
      )
      expect(line?.speaker).toBe(expected.speaker)
      expect(manifest[line?.key ?? '']?.speaker).toBe(expected.speaker)
    },
  )
})
