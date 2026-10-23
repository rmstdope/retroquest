/**
 * The script of an act's narration: every block the story will read aloud,
 * with its speaker and recording key, gathered by playing the act.
 *
 * `linesOfTurn` turns one answer into voiced lines, the way the story view
 * splits it (`parseTurn`): narration and speech are voiced, events, failures
 * and checklists are not, and unsigned writing is read by its writer.
 * `actScript` plays an act's golden path through the real engine and collects
 * the chapter page, every answer, each room's description on its first visit
 * and every quest card. At each step it also tries examining, using and
 * talking to whatever is at hand, on a copy of the game, so optional lines are recorded
 * too. The recording tools in `tts/` write the result to an act's script file.
 */

import { GameController, type Game } from '@/engine'
import { narrationKey, narrationText } from './narrationKey'
import { parseActIntro } from './parseActIntro'
import { parseTurn } from './parseTurn'

/** The speaker of everything that is not a character's speech. */
export const NARRATOR = 'narrator'

/** Unsigned writing that opens with `opening` is read by `speaker`. */
export interface WriterRule {
  opening: string
  speaker: string
}

/** One voiced block: its recording key, its speaker and its plain words. */
export interface ScriptLine {
  key: string
  speaker: string
  text: string
}

function line(speaker: string, markup: string): ScriptLine | null {
  const text = narrationText(markup)
  if (!text) return null
  return { key: narrationKey(speaker, text), speaker, text }
}

/** The writer of an unsigned text: the first rule its opening matches, else the narrator. */
function writerOf(text: string, writers: WriterRule[]): string {
  return (
    writers.find((rule) => text.startsWith(rule.opening))?.speaker ?? NARRATOR
  )
}

/** The voiced lines of one answer, in the order they are shown. */
export function linesOfTurn(
  markup: string,
  writers: WriterRule[],
): ScriptLine[] {
  const lines: Array<ScriptLine | null> = []
  for (const block of parseTurn(markup)) {
    if (block.kind === 'text') lines.push(line(NARRATOR, block.markup))
    if (block.kind === 'dialogue') {
      const speaker =
        block.speaker?.toLowerCase() ??
        writerOf(narrationText(block.markup), writers)
      lines.push(line(speaker, block.markup))
    }
  }
  return lines.filter((entry): entry is ScriptLine => entry !== null)
}

/** The chapter page: its heading ("Act I: The Call to Adventure"), then its paragraphs. */
function chapterLines(intro: string, writers: WriterRule[]): ScriptLine[] {
  const { act, title, body } = parseActIntro(intro)
  const heading = act && title ? line(NARRATOR, `${act}: ${title}`) : null
  return [...(heading ? [heading] : []), ...linesOfTurn(body, writers)]
}

/** The commands that try what is at hand: examine everything, use what is carried, talk to everyone, look. */
function probes(game: Game): string[] {
  const state = game.state
  const room = state.currentRoom
  return [
    ...room.items.map((item) => `examine ${item.name}`),
    ...state.inventory.map((item) => `examine ${item.name}`),
    ...state.inventory.map((item) => `use ${item.name}`),
    ...room.characters.map((character) => `talk to ${character.name}`),
    ...room.characters.map((character) => `examine ${character.name}`),
    'look',
  ]
}

/**
 * Every voiced line of an act, in the order a player along `commands` first
 * meets it, each once. `newGame` makes a fresh game of the act; one plays the
 * path and another, reloaded from it at each step, tries the probes.
 */
export function actScript(
  newGame: () => Game,
  commands: string[],
  writers: WriterRule[],
): ScriptLine[] {
  const script = new Map<string, ScriptLine>()
  const add = (lines: ScriptLine[]): void => {
    for (const entry of lines)
      if (!script.has(entry.key)) script.set(entry.key, entry)
  }
  const game = newGame()
  const play = new GameController(game)
  const probe = newGame()
  const tryOut = new GameController(probe)

  add(chapterLines(game.getActIntro(), writers))
  play.advanceToRunning()
  const visited = new Set<string>()
  const arrive = (): void => {
    const room = play.getRoomName()
    if (visited.has(room)) return
    visited.add(room)
    add(linesOfTurn(play.getRoomDescription(), writers))
  }
  arrive()
  for (const command of commands) {
    add(linesOfTurn(play.takeTurn(command), writers))
    const quests = play.settleQuests()
    for (const report of [
      ...quests.activated,
      ...quests.updated,
      ...quests.completed,
    ])
      add(linesOfTurn(report.text, writers))
    if (!game.isActRunning()) break
    arrive()
    const save = game.toSaveData()
    for (const command of probes(game)) {
      probe.loadSaveData(save)
      add(linesOfTurn(tryOut.handleCommand(command), writers))
    }
  }
  return [...script.values()]
}
