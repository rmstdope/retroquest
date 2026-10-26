/**
 * What `tts/extract-act.ts` writes, as functions: the per-act source table
 * (`ACT_SOURCES`), the act's narration script (`extractActScript`) and its music
 * loop (`extractActMusic`). Nothing here reads `process.argv` or writes a file,
 * so a vitest test can compare the result with the committed
 * `tts/act<N>/script.json` and `music.json`. Unsigned writing is given to its
 * writer by `act<N>/writers.json`; lines opening as in `act<N>/silent.json` stay
 * silent (instructions, not story); `act<N>/branches.json` lists optional scenes
 * to play on a copy (`ScriptBranch`).
 */
import { existsSync, readFileSync } from 'node:fs'
import { Game } from '../web/src/engine'
import type { Act } from '../web/src/engine'
import { Act1 } from '../web/src/act1/Act1'
import {
  ACT1_COMPLETING_COMMANDS,
  ACT1_GOLDEN_PATH,
} from '../web/src/act1/Act1GoldenPath'
import { Act2 } from '../web/src/act2/Act2'
import {
  ACT2_COMPLETING_COMMANDS,
  ACT2_GOLDEN_PATH,
} from '../web/src/act2/Act2GoldenPath'
import { Act3 } from '../web/src/act3/Act3'
import {
  ACT3_COMPLETING_COMMANDS,
  ACT3_GOLDEN_PATH,
} from '../web/src/act3/Act3GoldenPath'
import { Act4 } from '../web/src/act4/Act4'
import { ACT4_GOLDEN_PATH } from '../web/src/act4/Act4GoldenPath'
import {
  actScript,
  type ScriptBranch,
  type ScriptLine,
  type WriterRule,
} from '../web/src/lantern/narrationScript'
import { actLoops, type MusicTrack } from '../web/src/lantern/musicLists'

/** What the extractor needs of an act: a fresh act and the commands that play it to its end. */
export interface ActSource {
  make: () => Act
  commands: string[]
}

/** The source of each act by number: a fresh act and the commands that play it to its end. */
export const ACT_SOURCES: Record<string, ActSource> = {
  '1': {
    make: () => new Act1(),
    commands: [...ACT1_GOLDEN_PATH, ...ACT1_COMPLETING_COMMANDS],
  },
  '2': {
    make: () => new Act2(),
    // The golden path stops with Cedric waiting; the vision and his answer
    // end the act (branches.json plays the other answer, "say truth").
    commands: [...ACT2_GOLDEN_PATH, ...ACT2_COMPLETING_COMMANDS],
  },
  '3': {
    make: () => new Act3(),
    // The completing command plays the closing page into the script.
    commands: [...ACT3_GOLDEN_PATH, ...ACT3_COMPLETING_COMMANDS],
  },
  '4': { make: () => new Act4(), commands: ACT4_GOLDEN_PATH },
}

/** The act numbers the extractor knows, as the strings `extract-act.ts` takes. */
export const ACT_NUMBERS: string[] = Object.keys(ACT_SOURCES)

/** Returns the source of act `number`, or throws when there is none. */
function sourceOf(number: string): ActSource {
  const source = ACT_SOURCES[number]
  if (!source) throw new Error(`no such act: "${number}"`)
  return source
}

/** Reads and parses `tts/act<N>/<file>`, or returns `fallback` when it does not exist. */
function readJson<T>(number: string, file: string, fallback?: T): T {
  const url = new URL(`./act${number}/${file}`, import.meta.url)
  if (fallback !== undefined && !existsSync(url)) return fallback
  return JSON.parse(readFileSync(url, 'utf8')) as T
}

/**
 * Lines the engine picks at random (the phantoms' whispers) must all be in the
 * script, and the script must not depend on a roll: the act is played once for
 * each of these fixed rolls and the lines are merged by key.
 */
const ROLLS = [0, 0.25, 0.5, 0.75]

/** Plays act `number` and returns every line its story reads aloud, as `script.json` holds them. */
export function extractActScript(number: string): ScriptLine[] {
  const source = sourceOf(number)
  const writers = readJson<WriterRule[]>(number, 'writers.json')
  const silent = readJson<string[]>(number, 'silent.json')
  const branches = readJson<ScriptBranch[]>(number, 'branches.json', [])
  const lines = new Map<string, ScriptLine>()
  const random = Math.random
  try {
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
  } finally {
    Math.random = random
  }
  return [...lines.values()]
}

/** Returns the music loop of act `number`, as `music.json` holds it. */
export function extractActMusic(number: string): MusicTrack[] {
  return actLoops(sourceOf(number).make())
}
