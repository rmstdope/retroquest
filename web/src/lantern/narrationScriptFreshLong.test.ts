import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { extractActScript, LONG_ACT_NUMBERS } from '../../../tts/actScripts'

/** Acts 2 and 3 are slow to play on a loaded machine. */
const SLOW = 120_000

/**
 * The committed narration scripts of the two longest acts are what the
 * extractor would write now. It lives beside `narrationScriptFresh.test.ts`,
 * which checks the other acts, so that vitest runs the two files in parallel;
 * regenerate with `tts/extract-act.ts <N>`.
 */
describe('committed narration scripts of the long acts are current', () => {
  for (const number of LONG_ACT_NUMBERS) {
    it(
      `tts/act${number}/script.json is what extract-act.ts writes`,
      () => {
        const committed: unknown = JSON.parse(
          readFileSync(
            new URL(`../../../tts/act${number}/script.json`, import.meta.url),
            'utf8',
          ),
        )
        expect(extractActScript(number)).toEqual(committed)
      },
      SLOW,
    )
  }
})
