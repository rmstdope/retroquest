/**
 * Writes `tts/act1/script.json`: every Act I line the story reads aloud, with
 * its speaker and recording key, gathered by playing the golden path (see
 * `actScript`). Unsigned writing is given to its writer by `act1/writers.json`;
 * lines opening as in `act1/silent.json` stay silent (instructions, not story).
 * Run from `web/`: `npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-act1.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { Game } from '../web/src/engine'
import { Act1 } from '../web/src/act1/Act1'
import { ACT1_GOLDEN_PATH } from '../web/src/act1/Act1GoldenPath'
import { actScript, type WriterRule } from '../web/src/lantern/narrationScript'

/** The golden path stops short of the command that completes the act (see `Act1GoldenPath`). */
const ACT1_COMPLETES = 'use map'

const here = new URL('./act1/', import.meta.url)
const writers = JSON.parse(
  readFileSync(new URL('writers.json', here), 'utf8'),
) as WriterRule[]
const silent = JSON.parse(
  readFileSync(new URL('silent.json', here), 'utf8'),
) as string[]
const script = actScript(
  () => new Game([new Act1()]),
  [...ACT1_GOLDEN_PATH, ACT1_COMPLETES],
  writers,
).filter((line) => !silent.some((opening) => line.text.startsWith(opening)))
writeFileSync(
  new URL('script.json', here),
  JSON.stringify(script, null, 2) + '\n',
)
console.log(`${script.length} lines written to tts/act1/script.json`)
