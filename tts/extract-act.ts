/**
 * Writes `tts/act<N>/script.json` and `music.json` from `extractActScript` and
 * `extractActMusic` (see `actScripts.ts`, where the work is and which a vitest
 * test checks against the committed files).
 * Run from `web/`: `npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-act.ts 2`.
 */
import { writeFileSync } from 'node:fs'
import { ACT_NUMBERS, extractActMusic, extractActScript } from './actScripts'

const number = process.argv[2] ?? ''
if (!ACT_NUMBERS.includes(number))
  throw new Error(`usage: extract-act.ts <1|2|3|4>, got "${number}"`)

const here = new URL(`./act${number}/`, import.meta.url)
const script = extractActScript(number)
writeFileSync(
  new URL('script.json', here),
  JSON.stringify(script, null, 2) + '\n',
)
console.log(`${script.length} lines written to tts/act${number}/script.json`)
const loops = extractActMusic(number)
writeFileSync(
  new URL('music.json', here),
  JSON.stringify(loops, null, 2) + '\n',
)
console.log(`${loops.length} loops written to tts/act${number}/music.json`)
