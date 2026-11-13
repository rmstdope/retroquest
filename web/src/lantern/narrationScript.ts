/**
 * Which blocks the story reads aloud, and the script of an act's narration.
 *
 * The voiced blocks of each surface are defined once here, for both sides: the
 * recording tools key each recording by a block's speaker and words, and the
 * story view finds a recording by the same block (`findClip`).
 *
 * - `turnBlocks`: an answer, split as the story view splits it (`parseTurn`):
 *   narration (clue lines included) and speech are voiced; events (the echo of the
 *   player's command), plain refusals and checklists are not.
 *   Unsigned writing has no speaker on the page, so it is keyed as `UNSIGNED`.
 * - `introBlocks`: a chapter page that opens an act: its heading
 *   ("Act I: The Call to Adventure"), then its paragraphs. A closing chapter
 *   page's body is an answer (`turnBlocks`).
 * - `arrivalBlocks`: a room arrival: the room's name, then its description.
 * - `ownWordsBlocks`: Elior's own words of a `say <words> to <someone>`
 *   addressed to someone, said before the answer (`eliorLine`).
 * - `newSpellBlocks`: a learned spell's news: heading, name, description.
 * - `newQuestBlocks` / `questCompleteBlocks`: a new quest's card and a
 *   completed quest's pop-up: heading, quest name, then the quest's text
 *   (`questTextBlocks`: its paragraphs, then each checklist item).
 *
 * `actScript` plays an act's golden path through the real engine and collects
 * every voiced line: the chapter pages, every answer, each room's description
 * as each step leaves it (read again by looking around) and every quest card. At each step it also tries
 * examining, using and talking to whatever is at hand, looking, asking for a hint and resting, on a copy of the game,
 * and talks to each character there several times in a row (`TALKS`), so
 * optional lines and what a character says in turn are recorded too, and plays each `ScriptBranch` (an
 * optional scene the golden path does not take) on a copy, reading the room
 * after each of its steps. Elior's own words of each say command it plays are
 * read too. Who voices a line is its block's speaker,
 * except unsigned writing, which goes to its writer (`WriterRule`).
 */

import { GameController, type Game } from '@/engine'
import { narrationKey, narrationText } from './narrationKey'
import { parseActIntro } from './parseActIntro'
import { parseTurn, type TurnBlock } from './parseTurn'
import { ELIOR, eliorLine } from './stageSpeech'
import {
  newQuestKicker,
  QUEST_UPDATED_KICKER,
  questCompleteKicker,
} from './questNews'
import {
  SPELL_HEADING,
  toSpellNews,
  withoutLearnedLines,
  type SpellNews,
} from './spellNews'

/** The speaker of everything that is not a character's speech. */
export const NARRATOR = 'narrator'

/** The key speaker of unsigned writing (a letter, a journal page), which names no speaker. */
export const UNSIGNED = 'writing'

/** One block the story reads aloud: who says it (as the page knows it) and its markup. */
export interface VoicedBlock {
  speaker: string
  markup: string
}

/** Unsigned writing or narration that opens with `opening` is voiced by `speaker`. */
export interface WriterRule {
  opening: string
  speaker: string
}

/** One voiced line of the script: its id (the recording key), the voice that reads it and its words. */
export interface ScriptLine {
  id: string
  speaker: string
  text: string
}

/**
 * The voice of one block of an answer: the narrator for text (a clue line,
 * `clue()`, included), the speaker for speech (`UNSIGNED` for unsigned
 * writing); null for events, failures and checklists, which are not read
 * aloud.
 */
export function blockVoice(block: TurnBlock): VoicedBlock | null {
  if (block.kind === 'text') return { speaker: NARRATOR, markup: block.markup }
  if (block.kind === 'dialogue')
    return {
      speaker: block.speaker?.toLowerCase() ?? UNSIGNED,
      markup: block.markup,
    }
  return null
}

/** The voiced blocks of an answer, in the order they are shown. */
export function turnBlocks(markup: string): VoicedBlock[] {
  return parseTurn(markup).flatMap((block) => blockVoice(block) ?? [])
}

/**
 * The heading a chapter page has read before its text, or null without an act
 * and title: "Act I: The Call to Adventure" opens an act, "Act I complete. The
 * Call to Adventure." closes it. The recording tools and the page key their
 * clips by it, so it is defined once.
 */
export function chapterHeading(
  kind: 'intro' | 'complete',
  act: string,
  title: string,
): VoicedBlock | null {
  if (!act || !title) return null
  return {
    speaker: NARRATOR,
    markup:
      kind === 'intro' ? `${act}: ${title}` : `${act} complete. ${title}.`,
  }
}

/** The voiced blocks of the chapter page that opens an act: heading, then paragraphs. */
export function introBlocks(intro: string): VoicedBlock[] {
  const { act, title, body } = parseActIntro(intro)
  const heading = chapterHeading('intro', act, title)
  return [...(heading ? [heading] : []), ...turnBlocks(body)]
}

/**
 * A quest's text: its paragraphs, then each checklist item as its own line, so
 * an item that carries a count (game state) does not take the rest with it.
 */
export function questTextBlocks(text: string): VoicedBlock[] {
  const blocks: VoicedBlock[] = []
  for (const block of parseTurn(text)) {
    if (block.kind === 'text')
      blocks.push({ speaker: NARRATOR, markup: block.markup })
    if (block.kind === 'checklist')
      for (const item of block.items)
        blocks.push({ speaker: NARRATOR, markup: item.markup })
  }
  return blocks
}

/** A quest as a card or pop-up shows it: its name, whether it is the main quest, and its text. */
export interface QuestShown {
  main: boolean
  name: string
  text: string
}

/** A new quest's card: its heading ("New side quest"), its name, then its text. */
export function newQuestBlocks(quest: QuestShown): VoicedBlock[] {
  return [
    { speaker: NARRATOR, markup: newQuestKicker(quest.main) },
    { speaker: NARRATOR, markup: quest.name },
    ...questTextBlocks(quest.text),
  ]
}

/** A new spell: its heading ("New spell"), its name, then its description. */
export function newSpellBlocks(spell: SpellNews): VoicedBlock[] {
  return [
    { speaker: NARRATOR, markup: SPELL_HEADING },
    { speaker: NARRATOR, markup: spell.name },
    { speaker: NARRATOR, markup: spell.text },
  ]
}

/** A completed quest: its heading ("Main quest complete"), its name, then the completion text. */
export function questCompleteBlocks(quest: QuestShown): VoicedBlock[] {
  return [
    { speaker: NARRATOR, markup: questCompleteKicker(quest.main) },
    { speaker: NARRATOR, markup: quest.name },
    ...questTextBlocks(quest.text),
  ]
}

/** A quest's update: its heading ("Quest updated"), its name, then its new journal entry or checklist lines. */
export function questUpdatedBlocks(quest: QuestShown): VoicedBlock[] {
  return [
    { speaker: NARRATOR, markup: QUEST_UPDATED_KICKER },
    { speaker: NARRATOR, markup: quest.name },
    ...questTextBlocks(quest.text),
  ]
}

/**
 * Elior's own words when `command` was `say <words> to <someone>` and it
 * reached someone (`addressed`): one block in his voice, read before the
 * answer. None for any other command.
 */
export function ownWordsBlocks(
  command: string | null,
  addressed: boolean,
): VoicedBlock[] {
  const own = addressed ? eliorLine(command) : null
  return own ? [{ speaker: ELIOR.toLowerCase(), markup: own.markup }] : []
}

/** A room arrival: the room's name, then its description. */
export function arrivalBlocks(
  room: string,
  description: string,
): VoicedBlock[] {
  return [{ speaker: NARRATOR, markup: room }, ...turnBlocks(description)]
}

/**
 * The voice of a block: its speaker, or, for unsigned writing and for narration,
 * the first writer rule its opening matches (a dim note on the page is
 * narration but has a writer); unsigned writing that matches none is the
 * narrator's. The voice is a casting choice only: the key stays the block's.
 */
function voiceOf(block: VoicedBlock, writers: WriterRule[]): string {
  if (block.speaker !== UNSIGNED && block.speaker !== NARRATOR)
    return block.speaker
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
      id: narrationKey(block.speaker, block.markup),
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

/**
 * An optional scene the golden path does not take: once the command at index
 * `after` of the path has been played (`-1`: before the first, for a scene of
 * the opening dream), `commands` are played on a copy of the
 * game and everything they say is read too. `virtues` are recorded on the copy
 * first, for scenes that colour their lines by the virtues the player earned;
 * `unset` story flags are cleared on the copy, for a scene the path only
 * reaches after its flag is set (a room's reply before it has woken).
 * `without` items are taken out of the pack and `unlearn` spells forgotten on
 * the copy, for a reply the path never hears because it has everything by then
 * (what a character says of the one thing still missing).
 */
export interface ScriptBranch {
  after: number
  commands: string[]
  virtues?: string[]
  unset?: string[]
  without?: string[]
  unlearn?: string[]
}

/** How many times in a row each character at hand is talked to, so what they say in turn (rumours, news) is read. */
const TALKS = 8

/** The commands that try what is at hand: examine everything, use what is carried, talk to everyone, look, search, ask for a hint, rest. Looking around is also tried as the player's look, which reads the room again (see `actScript`). */
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
    'search',
    'hint',
    'rest',
  ]
}

/**
 * Every voiced line of an act, in the order a player along `commands` first
 * meets it, each once. `commands` should end with the command that completes
 * the act, so its answer and the closing chapter page are read too. Lines
 * that open with one of `silent` are left out (instructions, not story).
 * `newGame` makes a fresh game of the act; one plays the path and another,
 * reloaded from it at each step, tries the probes. `branches` are played the
 * same way, on a copy reloaded when the path reaches their step.
 */
export function actScript(
  newGame: () => Game,
  commands: string[],
  writers: WriterRule[],
  silent: string[] = [],
  branches: ScriptBranch[] = [],
): ScriptLine[] {
  const script = new Map<string, ScriptLine>()
  const add = (blocks: VoicedBlock[]): void => {
    for (const entry of scriptLines(blocks, writers)) {
      const quiet = silent.some((opening) => entry.text.startsWith(opening))
      if (!quiet && !script.has(entry.id)) script.set(entry.id, entry)
    }
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
    add(arrivalBlocks(room, play.getRoomDescription()))
  }
  arrive()
  /**
   * Add a command's answer and, when it taught spells, their news and the
   * answer without the learned lines (as the stage tells them in the middle;
   * the whole answer stays for the layouts that do not).
   */
  const addAnswer = (
    controller: GameController,
    answer: () => string,
  ): void => {
    const before = controller.getSpells().length
    const text = answer()
    add(turnBlocks(text))
    const learned = controller
      .getSpells()
      .slice(before)
      .map((spell) => toSpellNews(spell.name, spell.description))
    if (!learned.length) return
    for (const news of learned) add(newSpellBlocks(news))
    add(turnBlocks(withoutLearnedLines(text, learned)))
  }
  /** Play a turn of `command`: Elior's own words (a say command), then its answer. */
  const addTurn = (controller: GameController, command: string): void =>
    addAnswer(controller, () => {
      const text = controller.takeTurn(command)
      add(ownWordsBlocks(command, controller.lastTurnAddressee() !== null))
      return text
    })
  /** What is wrong with the branches, reported all at once when the act has been played. */
  const dead: string[] = []
  /** A branch as its failure names it: where it plays and what it does. */
  const nameOf = (branch: ScriptBranch): string =>
    `branch after ${branch.after} (${branch.commands.join(', ')})`
  for (const branch of branches)
    if (branch.after < -1 || branch.after >= commands.length)
      dead.push(
        `${nameOf(branch)} plays after no such step: the path has ` +
          `${commands.length} commands, so its lines would reach nobody.`,
      )
  /** Play a branch's command and fail when nobody here answers it. */
  const addBranchTurn = (branch: ScriptBranch, command: string): void => {
    let nobody = false
    addAnswer(tryOut, () => {
      const text = tryOut.takeTurn(command)
      const addressed = tryOut.lastTurnAddressee() !== null
      add(ownWordsBlocks(command, addressed))
      nobody =
        text.startsWith("[failure]You don't see") ||
        (command.startsWith('say ') && !addressed)
      return text
    })
    if (nobody)
      dead.push(
        `${nameOf(branch)}: "${command}" reaches nobody here, so the lines ` +
          'it was written for are not in the script.',
      )
  }
  const playBranches = (after: number): void => {
    for (const branch of branches.filter((b) => b.after === after)) {
      probe.loadSaveData(game.toSaveData())
      for (const virtue of branch.virtues ?? []) probe.state.addVirtue(virtue)
      for (const flag of branch.unset ?? [])
        probe.state.setStoryFlag(flag, false)
      for (const item of branch.without ?? [])
        probe.state.removeItemFromInventory(item)
      probe.state.knownSpells = probe.state.knownSpells.filter(
        (spell) => !(branch.unlearn ?? []).includes(spell.id.toLowerCase()),
      )
      for (const step of branch.commands) {
        addBranchTurn(branch, step)
        settle(tryOut)
        // The room as the scene leaves it, which the path may never show.
        if (probe.isActRunning())
          add(arrivalBlocks(tryOut.getRoomName(), tryOut.getRoomDescription()))
      }
    }
  }
  const tryProbes = (): void => {
    const save = game.toSaveData()
    for (const command of probes(game)) {
      probe.loadSaveData(save)
      addAnswer(tryOut, () => tryOut.handleCommand(command))
    }
    // Talking again draws out what a character says in turn (rumours, news).
    for (const character of game.state.currentRoom.characters) {
      probe.loadSaveData(save)
      for (let time = 0; time < TALKS; time++)
        addAnswer(tryOut, () =>
          tryOut.handleCommand(`talk to ${character.name}`),
        )
    }
    // Looking around reads the room again as the story has left it.
    probe.loadSaveData(save)
    addAnswer(tryOut, () => tryOut.look())
    add(arrivalBlocks(tryOut.getRoomName(), tryOut.getRoomDescription()))
  }
  const settle = (controller: GameController): void => {
    const quests = controller.settleQuests()
    for (const report of quests.activated) add(newQuestBlocks(report))
    for (const report of quests.updated) add(questUpdatedBlocks(report))
    for (const report of quests.completed) add(questCompleteBlocks(report))
  }
  tryProbes()
  playBranches(-1)
  for (const [index, command] of commands.entries()) {
    addTurn(play, command)
    settle(play)
    playBranches(index)
    if (!game.isActRunning()) {
      const { act, title } = parseActIntro(game.getActIntro())
      const heading = chapterHeading('complete', act, title)
      if (heading) add([heading])
      add(turnBlocks(play.getActCompleteText() ?? ''))
      break
    }
    arrive()
    tryProbes()
  }
  if (dead.length) throw new Error(dead.join('\n'))
  return [...script.values()]
}
