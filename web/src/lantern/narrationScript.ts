/**
 * Which blocks the story reads aloud, and the script of an act's narration.
 *
 * The voiced blocks of each surface are defined once here, for both sides: the
 * recording tools key each recording by a block's speaker and words, and the
 * story view finds a recording by the same block (`findClip`).
 *
 * - `turnBlocks`: an answer, split as the story view splits it (`parseTurn`):
 *   narration and speech are voiced, events, failures and checklists are not.
 *   Unsigned writing has no speaker on the page, so it is keyed as `UNSIGNED`.
 * - `introBlocks`: a chapter page that opens an act: its heading
 *   ("Act I: The Call to Adventure"), then its paragraphs. A closing chapter
 *   page's body is an answer (`turnBlocks`).
 * - `questCardBlocks`: a quest card in the story, read whole as it is shown.
 *
 * `actScript` plays an act's golden path through the real engine and collects
 * every voiced line: the chapter pages, every answer, each room's description
 * on its first visit and every quest card. At each step it also tries
 * examining, using and talking to whatever is at hand, on a copy of the game,
 * so optional lines are recorded too. Who voices a line is its block's speaker,
 * except unsigned writing, which goes to its writer (`WriterRule`).
 */

import { GameController, type Game } from '@/engine'
import { narrationKey, narrationText } from './narrationKey'
import { parseActIntro } from './parseActIntro'
import { parseTurn } from './parseTurn'

/** The speaker of everything that is not a character's speech. */
export const NARRATOR = 'narrator'

/** The key speaker of unsigned writing (a letter, a journal page), which names no speaker. */
export const UNSIGNED = 'writing'

/** One block the story reads aloud: who says it (as the page knows it) and its markup. */
export interface VoicedBlock {
  speaker: string
  markup: string
}

/** Unsigned writing that opens with `opening` is voiced by `speaker`. */
export interface WriterRule {
  opening: string
  speaker: string
}

/** One voiced line of the script: its recording key, the voice that reads it and its words. */
export interface ScriptLine {
  key: string
  speaker: string
  text: string
}

/** The voiced blocks of an answer, in the order they are shown. */
export function turnBlocks(markup: string): VoicedBlock[] {
  const blocks: VoicedBlock[] = []
  for (const block of parseTurn(markup)) {
    if (block.kind === 'text')
      blocks.push({ speaker: NARRATOR, markup: block.markup })
    if (block.kind === 'dialogue')
      blocks.push({
        speaker: block.speaker?.toLowerCase() ?? UNSIGNED,
        markup: block.markup,
      })
  }
  return blocks
}

/** The voiced blocks of the chapter page that opens an act: heading, then paragraphs. */
export function introBlocks(intro: string): VoicedBlock[] {
  const { act, title, body } = parseActIntro(intro)
  const heading =
    act && title ? [{ speaker: NARRATOR, markup: `${act}: ${title}` }] : []
  return [...heading, ...turnBlocks(body)]
}

/** A quest card is read whole, as it is shown. */
export function questCardBlocks(text: string): VoicedBlock[] {
  return [{ speaker: NARRATOR, markup: text }]
}

/** The voice of a block: its speaker, or for unsigned writing the first writer rule its opening matches, else the narrator. */
function voiceOf(block: VoicedBlock, writers: WriterRule[]): string {
  if (block.speaker !== UNSIGNED) return block.speaker
  const text = narrationText(block.markup)
  return (
    writers.find((rule) => text.startsWith(rule.opening))?.speaker ?? NARRATOR
  )
}

/** Script lines for voiced blocks: keyed by the block as shown, voiced by `voiceOf`; blocks without words are dropped. */
function scriptLines(
  blocks: VoicedBlock[],
  writers: WriterRule[],
): ScriptLine[] {
  return blocks
    .map((block) => ({
      key: narrationKey(block.speaker, block.markup),
      speaker: voiceOf(block, writers),
      text: narrationText(block.markup),
    }))
    .filter((entry) => entry.text.length > 0)
}

/** The script lines of one answer, in the order they are shown. */
export function linesOfTurn(
  markup: string,
  writers: WriterRule[],
): ScriptLine[] {
  return scriptLines(turnBlocks(markup), writers)
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
 * meets it, each once. `commands` should end with the command that completes
 * the act, so its answer and the closing chapter page are read too. `newGame` makes a fresh game of the act; one plays the
 * path and another, reloaded from it at each step, tries the probes.
 */
export function actScript(
  newGame: () => Game,
  commands: string[],
  writers: WriterRule[],
): ScriptLine[] {
  const script = new Map<string, ScriptLine>()
  const add = (blocks: VoicedBlock[]): void => {
    for (const entry of scriptLines(blocks, writers))
      if (!script.has(entry.key)) script.set(entry.key, entry)
  }
  const game = newGame()
  const play = new GameController(game)
  const probe = newGame()
  const tryOut = new GameController(probe)

  add(introBlocks(game.getActIntro()))
  play.advanceToRunning()
  const visited = new Set<string>()
  const arrive = (): void => {
    const room = play.getRoomName()
    if (visited.has(room)) return
    visited.add(room)
    add(turnBlocks(play.getRoomDescription()))
  }
  arrive()
  for (const command of commands) {
    add(turnBlocks(play.takeTurn(command)))
    const quests = play.settleQuests()
    for (const report of [
      ...quests.activated,
      ...quests.updated,
      ...quests.completed,
    ])
      add(questCardBlocks(report.text))
    if (!game.isActRunning()) {
      add(turnBlocks(play.getActCompleteText() ?? ''))
      break
    }
    arrive()
    const save = game.toSaveData()
    for (const command of probes(game)) {
      probe.loadSaveData(save)
      add(turnBlocks(tryOut.handleCommand(command)))
    }
  }
  return [...script.values()]
}
