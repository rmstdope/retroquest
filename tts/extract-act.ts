/**
 * Writes `tts/act<N>/script.json`: every Act N line the story reads aloud, with
 * its speaker and recording key, gathered by playing the golden path (see
 * `actScript`). Unsigned writing is given to its writer by `act<N>/writers.json`;
 * lines opening as in `act<N>/silent.json` stay silent (instructions, not story).
 * `act<N>/branches.json` lists optional scenes to play on a copy (`ScriptBranch`).
 * It also writes `tts/act<N>/music.json`, the act's loop (see `actLoops`).
 * Run from `web/`: `npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-act.ts 2`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { Game } from '../web/src/engine'
import type { Act } from '../web/src/engine'
import { Act1 } from '../web/src/act1/Act1'
import {
  ACT1_COMPLETING_COMMAND,
  ACT1_GOLDEN_PATH,
} from '../web/src/act1/Act1GoldenPath'
import { Act2 } from '../web/src/act2/Act2'
import { ACT2_GOLDEN_PATH } from '../web/src/act2/Act2GoldenPath'
import { Act3 } from '../web/src/act3/Act3'
import { ACT3_GOLDEN_PATH } from '../web/src/act3/Act3GoldenPath'
import { Act4 } from '../web/src/act4/Act4'
import { ACT4_GOLDEN_PATH } from '../web/src/act4/Act4GoldenPath'
import {
  actScript,
  type ScriptBranch,
  type ScriptLine,
  type WriterRule,
} from '../web/src/lantern/narrationScript'
import { actLoops } from '../web/src/lantern/musicLists'

/** What the extractor needs of an act: a fresh act and the commands that play it to its end. */
interface ActSource {
  make: () => Act
  commands: string[]
}

const ACTS: Record<string, ActSource> = {
  '1': {
    make: () => new Act1(),
    commands: [...ACT1_GOLDEN_PATH, ACT1_COMPLETING_COMMAND],
  },
  '2': {
    make: () => new Act2(),
    // The golden path stops with Cedric waiting; the vision and his answer
    // end the act (branches.json plays the other answer, "say truth").
    commands: [
      ...ACT2_GOLDEN_PATH,
      'cast prophetic vision',
      'talk to sir cedric',
    ],
  },
  '3': {
    make: () => new Act3(),
    // 'examine gates' plays the closing page into the script.
    commands: [...ACT3_GOLDEN_PATH, 'examine gates'],
  },
  '4': { make: () => new Act4(), commands: ACT4_GOLDEN_PATH },
}

const number = process.argv[2] ?? ''
const source = ACTS[number]
if (!source) throw new Error(`usage: extract-act.ts <1|2|3|4>, got "${number}"`)

const here = new URL(`./act${number}/`, import.meta.url)
const writers = JSON.parse(
  readFileSync(new URL('writers.json', here), 'utf8'),
) as WriterRule[]
const silent = JSON.parse(
  readFileSync(new URL('silent.json', here), 'utf8'),
) as string[]
const branchesFile = new URL('branches.json', here)
const branches = existsSync(branchesFile)
  ? (JSON.parse(readFileSync(branchesFile, 'utf8')) as ScriptBranch[])
  : []
/**
 * Lines the engine picks at random (the phantoms' whispers) must all be in the
 * script, and the script must not depend on a roll: the act is played once for
 * each of these fixed rolls and the lines are merged by key.
 */
const ROLLS = [0, 0.25, 0.5, 0.75]
const lines = new Map<string, ScriptLine>()
for (const roll of ROLLS) {
  Math.random = (): number => roll
  for (const line of actScript(
    () => new Game([source.make()]),
    source.commands,
    writers,
    silent,
    branches,
  ))
    if (!lines.has(line.key)) lines.set(line.key, line)
}
const script = [...lines.values()]
writeFileSync(
  new URL('script.json', here),
  JSON.stringify(script, null, 2) + '\n',
)
console.log(`${script.length} lines written to tts/act${number}/script.json`)
const loops = actLoops(source.make())
writeFileSync(
  new URL('music.json', here),
  JSON.stringify(loops, null, 2) + '\n',
)
console.log(`${loops.length} loops written to tts/act${number}/music.json`)
