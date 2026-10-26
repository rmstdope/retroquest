import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ACT_NUMBERS,
  extractActMusic,
  extractActScript,
} from '../../../tts/actScripts'

/** Each act is played four times by the extractor, which is slow on a loaded machine. */
const SLOW = 120_000

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
 * The committed narration script and music list of each act are what the
 * extractor would write now. A change to what the game says that leaves them
 * behind fails here; regenerate with `tts/extract-act.ts <N>`.
 */
describe('committed narration files are current', () => {
  for (const number of ACT_NUMBERS) {
    it(
      `tts/act${number}/script.json is what extract-act.ts writes`,
      () => {
        expect(extractActScript(number)).toEqual(
          committed(number, 'script.json'),
        )
      },
      SLOW,
    )
    it(`tts/act${number}/music.json is what extract-act.ts writes`, () => {
      expect(extractActMusic(number)).toEqual(committed(number, 'music.json'))
    })
  }
})
