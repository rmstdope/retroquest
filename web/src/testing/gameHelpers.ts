/**
 * Shared assertions and helpers for act tests (the port of
 * tests/retroquest/utils/utils.py and the markup helpers).
 */
import { expect } from 'vitest'
import {
  findMarkupProblems,
  type Game,
  type GameState,
  type Room,
} from '@/engine'

/**
 * Run commands in order, settling quest changes after each, and return all answers.
 * Every answer must be well-formed markup (known, balanced, attributed): the
 * check runs on all output here, so the act integration tests need no opt-in.
 */
export function executeCommands(game: Game, commands: string[]): string {
  const results: string[] = []
  for (const command of commands) {
    const answer = game.commandParser.parse(command)
    const problems = findMarkupProblems(answer)
    expect(problems, `malformed markup after "${command}": ${answer}`).toEqual(
      [],
    )
    results.push(answer)
    game.state.settleQuests()
  }
  return results.join('')
}

/**
 * The index in a golden path of the `occurrence`th (1-based) time `command`
 * appears; the marker a stage of an act's integration test starts or ends at.
 * Throws when the path does not have that many.
 */
export function pathIndex(
  path: string[],
  command: string,
  occurrence = 1,
): number {
  let seen = 0
  for (let index = 0; index < path.length; index++) {
    if (path[index] === command && ++seen === occurrence) return index
  }
  throw new Error(
    `"${command}" does not occur ${occurrence} time(s) on the path`,
  )
}

/**
 * Play the commands of `path` from index `from` up to, not including, index
 * `to`, as {@link executeCommands} does, and return all answers. A stage's
 * test plays the path to its start, then its own slice, and asserts on it.
 */
export function playPath(
  game: Game,
  path: string[],
  from: number,
  to: number,
): string {
  return executeCommands(game, path.slice(from, to))
}

function lowerNames(named: { name: string }[]): string[] {
  return named.map((entry) => entry.name.toLowerCase())
}

export function expectItemInInventory(
  state: GameState,
  itemName: string,
  present = true,
): void {
  const names = lowerNames(state.inventory)
  if (present)
    expect(names, `${itemName} in inventory`).toContain(itemName.toLowerCase())
  else
    expect(names, `${itemName} not in inventory`).not.toContain(
      itemName.toLowerCase(),
    )
}

export function expectItemCountInInventory(
  state: GameState,
  itemName: string,
  count: number,
): void {
  const actual = lowerNames(state.inventory).filter(
    (n) => n === itemName.toLowerCase(),
  )
  expect(actual, `${count} ${itemName} in inventory`).toHaveLength(count)
}

export function expectItemInRoom(
  room: Room,
  itemName: string,
  present = true,
): void {
  const names = lowerNames(room.items)
  if (present)
    expect(names, `${itemName} in ${room.name}`).toContain(
      itemName.toLowerCase(),
    )
  else
    expect(names, `${itemName} not in ${room.name}`).not.toContain(
      itemName.toLowerCase(),
    )
}

export function expectCharacterInRoom(
  room: Room,
  characterName: string,
  present = true,
): void {
  const names = lowerNames(room.characters)
  const wanted = characterName.toLowerCase()
  if (present)
    expect(names, `${characterName} in ${room.name}`).toContain(wanted)
  else
    expect(names, `${characterName} not in ${room.name}`).not.toContain(wanted)
}

/** Assert whether the player knows the spell with this id (any case). */
export function expectSpellKnown(
  state: GameState,
  spellId: string,
  known = true,
): void {
  const names = state.knownSpells.map((spell) => spell.id.toLowerCase())
  if (known) expect(names, `${spellId} known`).toContain(spellId.toLowerCase())
  else
    expect(names, `${spellId} not known`).not.toContain(spellId.toLowerCase())
}

export function expectStoryFlag(
  state: GameState,
  flag: string,
  value = true,
): void {
  expect(state.getStoryFlag(flag), `story flag ${flag}`).toBe(value)
}

export function expectCurrentRoom(state: GameState, roomName: string): void {
  expect(state.currentRoom.name).toBe(roomName)
}

export function expectQuestCompleted(
  state: GameState,
  questName: string,
): void {
  expect(state.isQuestCompleted(questName), `${questName} completed`).toBe(true)
}

/** The active quests are exactly these (by name, any order). */
export function expectQuests(state: GameState, expectedActive: string[]): void {
  const active = state.activatedQuests.map((q) => q.name).sort()
  expect(active).toEqual([...expectedActive].sort())
}

// --- Markup, as the web UI parses it (web/src/lantern/parseTurn.ts) ---

const DIALOGUE_PATTERN = /\[dialogue\].*?\[\/dialogue\]/gs
const CHARACTER_NAME_PATTERN = /\[character_name\](.*?)\[\/character_name\]/gs
const QUOTED_SPEECH_PATTERN = /(?<![A-Za-z])'[A-Z]/

/** Every tag is known, balanced, never nested in itself, and dialogue is attributed. */
export function expectMarkupWellFormed(text: string): void {
  expect(findMarkupProblems(text), `markup problems in: ${text}`).toEqual([])
}

/**
 * Every dialogue block is attributed (by the last character name before it)
 * to speaker, and at least one is. Blocks introduced by Elior's own name line
 * are skipped, so his lines may be interleaved; a bare block after one still
 * counts as his and fails.
 */
export function expectDialogueSpeaker(text: string, speaker: string): void {
  const blocks = [...text.matchAll(DIALOGUE_PATTERN)]
  expect(blocks.length, `no dialogue in: ${text}`).toBeGreaterThan(0)
  let narration = ''
  let position = 0
  let spoken = 0
  for (const block of blocks) {
    const before = text.slice(position, block.index)
    narration += before
    position = block.index + block[0].length
    const names = [...narration.matchAll(CHARACTER_NAME_PATTERN)].map(
      (m) => m[1],
    )
    expect(
      names.length,
      `no speaker before dialogue in: ${text}`,
    ).toBeGreaterThan(0)
    // Elior's own lines are interleaved with the other speaker's; skip a
    // block only when his name line comes directly before it.
    const own = new RegExp(
      `\\[character_name\\]Elior\\[/character_name\\]\\s*$`,
    ).test(before)
    if (own && speaker.toLowerCase() !== 'elior') continue
    spoken += 1
    expect(names.at(-1)?.toLowerCase(), `dialogue speaker in: ${text}`).toBe(
      speaker.toLowerCase(),
    )
  }
  expect(spoken, `${speaker} never speaks in: ${text}`).toBeGreaterThan(0)
}

/** No dialogue block contains a 'Name:' speaker label. */
export function expectNoSpeakerLabelInDialogue(text: string): void {
  for (const [block] of text.matchAll(DIALOGUE_PATTERN)) {
    expect(block, `speaker label inside dialogue in: ${text}`).not.toContain(
      '[/character_name]:',
    )
  }
}

/** No quoted speech appears in the narration outside dialogue. */
export function expectNoSpeechOutsideDialogue(text: string): void {
  const narration = text.replace(DIALOGUE_PATTERN, '')
  expect(
    QUOTED_SPEECH_PATTERN.test(narration),
    `speech outside dialogue in: ${text}`,
  ).toBe(false)
}
