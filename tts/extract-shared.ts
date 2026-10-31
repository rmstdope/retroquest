/**
 * Writes `tts/stingers.json`: the game's stingers, the quest sounds, in Content
 * Studio's track format (see `questStingers`). It is the `music.refreshShared`
 * command of `content-studio.json`; each act's loop is written by `extract-act.ts`.
 * Run from `web/`: `npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-shared.ts`.
 */
import { writeFileSync } from 'node:fs'
import { questStingers } from '../web/src/lantern/musicLists'

const stingers = questStingers()
writeFileSync(
  new URL('stingers.json', import.meta.url),
  JSON.stringify(stingers, null, 2) + '\n',
)
console.log(`${stingers.length} stingers written to tts/stingers.json`)
