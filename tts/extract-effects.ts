/**
 * Writes `tts/effects.json`: the game's sound effects in Content Studio's list format
 * (see `effectsList`). It runs in the `refresh.shared` command of `content-studio.json`.
 * Run from `web/`: `npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-effects.ts`.
 */
import { writeFileSync } from 'node:fs'
import { effectsList } from '../web/src/lantern/effectLists'

const effects = effectsList()
writeFileSync(
  new URL('effects.json', import.meta.url),
  JSON.stringify(effects, null, 2) + '\n',
)
console.log(`${effects.length} sound effects written to tts/effects.json`)
