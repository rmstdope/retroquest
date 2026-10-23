/**
 * Writes `tts/act1/script.json`: every Act I line the story reads aloud, with
 * its speaker and recording key, gathered by playing the golden path (see
 * `actScript`). Unsigned writing is given to its writer by `act1/writers.json`.
 * Run from `web/`: `npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-act1.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { Game } from '../web/src/engine'
import { Act1 } from '../web/src/act1/Act1'
import { ACT1_GOLDEN_PATH } from '../web/src/act1/Act1GoldenPath'
import { actScript, type WriterRule } from '../web/src/lantern/narrationScript'

const here = new URL('./act1/', import.meta.url)
const writers = JSON.parse(
  readFileSync(new URL('writers.json', here), 'utf8'),
) as WriterRule[]
const script = actScript(
  () => new Game([new Act1()]),
  ACT1_GOLDEN_PATH,
  writers,
)
writeFileSync(
  new URL('script.json', here),
  JSON.stringify(script, null, 2) + '\n',
)
console.log(`${script.length} lines written to tts/act1/script.json`)
