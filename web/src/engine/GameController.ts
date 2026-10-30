/**
 * The read model a UI uses on top of Game: journal lists, room data, quest
 * pop-ups, progress and stats as plain data (names still carry engine markup).
 */
import type { Character } from './Character'
import type { CompletionTree, Game } from './Game'
import type { Item } from './Item'
import type { Quest, QuestDetails } from './Quest'

/** A journal entry: a name (with markup) and its text. */
export interface NamedItem {
  name: string
  description: string
}

/** Something a merchant in the room sells. */
export interface RoomWare {
  name: string
  price: number
  seller: string
}

/** A quest as the journal lists it: who it is, whether it is done, its log. */
export interface QuestSummary {
  name: string
  main: boolean
  done: boolean
  /** A completed quest is a journal holding its completion text. */
  details: QuestDetails
}

/** A quest that started, moved on or completed in the last turn. */
export interface QuestReport {
  name: string
  main: boolean
  /**
   * Engine markup for the story: the description (a start), the newest
   * journal entry or the whole checklist (an update), the completion text.
   */
  text: string
}

/** The quest events one settling produced. */
export interface QuestPayloads {
  /** Quests that just started. */
  activated: QuestReport[]
  /** Quests whose log just changed. */
  updated: QuestReport[]
  /** Quests that just completed. */
  completed: QuestReport[]
}

/** One result screen: its text, and the act-complete part of it if it has one. */
export interface ResultScreen {
  text: string
  actComplete: string | null
}

export interface QuestProgress {
  /** Quests completed in the current act. */
  completed: number
  /** All quests of the act, including ones not yet started. */
  total: number
  /** 1-based number of the act. */
  actNumber: number
  /** The main quest's plain name, or null when the act has none. */
  mainQuest: string | null
}

/** An act's statistics for its act-complete page. */
export interface ActStats {
  questsCompleted: number
  questsTotal: number
  /** Spells known. */
  spells: number
  /** Rooms visited. */
  places: number
}

export interface MusicInfo {
  musicFile: string
  musicInfo: string
}

/** Where the music plays: the act's name and the key of the player's room, both '' while nothing plays. */
export interface MusicPlace {
  actName: string
  roomKey: string
}

/** A character selling wares, like the act shopkeepers. */
interface Merchant extends Character {
  wares: Record<string, { item: Item; price: number }>
}

function isMerchant(character: Character): character is Merchant {
  return (
    'wares' in character &&
    typeof character.wares === 'object' &&
    character.wares !== null
  )
}

/** A quest event: the quest and the text the story shows for it. */
function questReport(quest: Quest, text: string): QuestReport {
  return {
    name: quest.name,
    main: quest.isMain(),
    text,
  }
}

/**
 * What the story shows of an updated quest: a journal's newest entry, a
 * checklist whole, or only its items once none is open.
 */
function newsText(quest: Quest): string {
  const details = quest.details()
  if (details.kind === 'journal') return details.latest || quest.description
  if (details.items.every((item) => item.done))
    return details.items.map((item) => `✓ ${item.text}`).join('\n')
  return quest.description
}

/**
 * A quest for the journal list. A finished journal quest shows how it ended;
 * a finished checklist quest keeps its whole list and adds the outcome.
 */
function questSummary(quest: Quest, done: boolean): QuestSummary {
  return {
    name: quest.name,
    main: quest.isMain(),
    done,
    details: logOf(quest, done),
  }
}

/** The log a quest shows, finished or not. */
function logOf(quest: Quest, done: boolean): QuestDetails {
  const details = quest.details()
  if (!done) return details
  if (details.kind === 'checklist')
    return { ...details, outcome: quest.completion }
  return { kind: 'journal', latest: quest.completion, earlier: [] }
}

/**
 * How a turn describes the room, the one fact the story, the narration and the
 * arrival block read: `moved` when the player is in a different room than
 * before (a move, or the engine placing them), `firstVisit` when that room is
 * new to them. A look describes the room with `moved` false.
 */
export interface RoomDescription {
  moved: boolean
  firstVisit: boolean
}

/** The description of a room shown again after a load: an arrival, not a first visit. */
export const LOADED_ROOM: RoomDescription = { moved: true, firstVisit: false }

export class GameController {
  /** How the last turn described the room, or null when it did not. */
  private roomDescription: RoomDescription | null = null

  constructor(readonly game: Game) {}

  /** The first text to show (the logo). */
  start(): string {
    return this.game.getResultText()
  }

  /** Parse a command and answer it, without starting a new turn (stats, help). */
  handleCommand(command: string): string {
    return this.game.commandParser.parse(command)
  }

  /**
   * Play a command: parse it, then start the next turn. How the command
   * described the room (a move, a look, or the engine placing the player in a
   * new room) is kept for `lastTurnRoomDescription`, worked out before the
   * next turn can change rooms.
   */
  takeTurn(command: string): string {
    const roomBefore = this.game.state.currentRoom.name
    const visitedBefore = this.getVisitedRooms()
    this.game.hasChangedRoom = false
    const result = this.handleCommand(command)
    const roomAfter = this.game.state.currentRoom.name
    const moved = roomAfter !== roomBefore
    this.roomDescription =
      moved || this.game.hasChangedRoom
        ? { moved, firstVisit: moved && !visitedBefore.includes(roomAfter) }
        : null
    this.game.newTurn()
    return result
  }

  /**
   * How the last `takeTurn` (or `look` / `openRoom`) described the room: null
   * when the room is not shown this turn, otherwise whether the player moved
   * and whether the room is new to them.
   */
  lastTurnRoomDescription(): RoomDescription | null {
    return this.roomDescription
  }

  /** The current result text, then a new turn (the logo and intro screens). */
  advanceTurn(): string {
    const text = this.game.getResultText()
    this.game.newTurn()
    return text
  }

  /** The texts of the logo and intro screens, then the running act's first text. */
  advanceToRunning(): ResultScreen[] {
    const screens: ResultScreen[] = []
    const addScreen = (): void => {
      screens.push({
        text: this.game.getResultText(),
        actComplete: this.game.getActCompleteText(),
      })
    }
    while (!this.game.isActRunning()) {
      addScreen()
      this.game.newTurn()
    }
    addScreen()
    return screens
  }

  /** The current run state's text, without a new turn. */
  getResultText(): string {
    return this.game.getResultText()
  }

  /** The act-complete text of the current screen, or null when it has none. */
  getActCompleteText(): string | null {
    return this.game.getActCompleteText()
  }

  /** True while the game takes a typed command. */
  isAcceptingInput(): boolean {
    return this.game.acceptInput
  }

  /** The command words the game would accept next, as a tree. */
  getCommandCompletions(): CompletionTree {
    return this.game.getCommandCompletions()
  }

  /** The active quests with their logs as data. */
  getActiveQuests(): QuestSummary[] {
    return this.game.state.activatedQuests.map((quest) =>
      questSummary(quest, false),
    )
  }

  /** The completed quests; the log of each is how it ended. */
  getCompletedQuests(): QuestSummary[] {
    return this.game.state.completedQuests.map((quest) =>
      questSummary(quest, true),
    )
  }

  /** Carried items, equal ones counted together. */
  getInventory(): NamedItem[] {
    const counts = this.game.state.getInventorySummary()
    const seen = new Set<string>()
    const entries: NamedItem[] = []
    for (const item of this.game.state.inventory) {
      if (seen.has(item.name)) continue
      seen.add(item.name)
      const count = counts[item.name]
      entries.push({
        name:
          count > 1
            ? `[item_name]${count} ${item.name}[/item_name]`
            : `[item_name]${item.name}[/item_name]`,
        description: item.description,
      })
    }
    return entries
  }

  getSpells(): NamedItem[] {
    return this.game.state.knownSpells.map((spell) => ({
      name: `[spell_name]${spell.name}[/spell_name]`,
      description: spell.description,
    }))
  }

  saveGame(name?: string): string {
    return this.game.save(name)
  }

  loadGame(name?: string): string {
    return this.game.load(name)
  }

  getActIntro(): string {
    return this.game.getActIntro()
  }

  /** Look around: the room is described again without a move. */
  look(): string {
    this.roomDescription = { moved: false, firstVisit: false }
    return this.game.look()
  }

  /** The look that opens an act: its first room is described as a first arrival. */
  openRoom(): string {
    const text = this.game.look()
    this.roomDescription = { moved: true, firstVisit: true }
    return text
  }

  /**
   * Settle the quest events of the turn and return them for the story: quests
   * that started (only while an act runs), quests whose log changed, and
   * quests that completed. Between acts and after the last one only
   * completions are settled, so the completion that ended the act reaches the
   * story (the engine still holds the finished act).
   */
  settleQuests(): QuestPayloads {
    const payloads: QuestPayloads = {
      activated: [],
      updated: [],
      completed: [],
    }
    const game = this.game
    if (game.isActTransitioning() || game.isGameOver()) {
      payloads.completed = game.state
        .settleQuests()
        .completed.map((q) => questReport(q, q.completion))
    } else if (game.isActRunning()) {
      const changes = game.state.settleQuests()
      payloads.activated = changes.activated.map((q) =>
        questReport(q, q.description),
      )
      payloads.updated = changes.updated.map((q) => questReport(q, newsText(q)))
      payloads.completed = changes.completed.map((q) =>
        questReport(q, q.completion),
      )
    }
    return payloads
  }

  /** The rooms the player has been in so far, by name (the story reads a room on its first visit). */
  getVisitedRooms(): string[] {
    return [...this.game.state.visitedRooms]
  }

  getRoomName(): string {
    return this.game.state.currentRoom.name
  }

  getActName(): string {
    return this.game.getActName()
  }

  /** Quest progress of the act; between acts, of the act that just ended. */
  getQuestProgress(): QuestProgress {
    const state = this.game.state
    const actIndex = this.game.currentAct
    const all = [
      ...state.nonActivatedQuests,
      ...state.activatedQuests,
      ...state.completedQuests,
    ]
    return {
      completed: state.completedQuests.length,
      total: all.length,
      actNumber: actIndex + 1,
      mainQuest: all.find((quest) => quest.isMain())?.name ?? null,
    }
  }

  /** The act's statistics; between acts, the finished act's. */
  getActStats(): ActStats {
    const progress = this.getQuestProgress()
    const state = this.game.state
    return {
      questsCompleted: progress.completed,
      questsTotal: progress.total,
      spells: state.knownSpells.length,
      places: state.visitedRooms.length,
    }
  }

  getRoomDescription(): string {
    return this.game.state.currentRoom.descriptionFor(this.game.state)
  }

  getRoomCharacters(): string[] {
    return this.game.state.currentRoom.characters.map((c) => c.name)
  }

  /** Everything sold in the room, by the merchants' `wares`. */
  getRoomWares(): RoomWare[] {
    const wares: RoomWare[] = []
    for (const character of this.game.state.currentRoom.characters) {
      if (!isMerchant(character)) continue
      for (const [name, details] of Object.entries(character.wares)) {
        wares.push({ name, price: details.price, seller: character.name })
      }
    }
    return wares
  }

  getRoomItems(): string[] {
    return this.game.state.currentRoom.items.map((item) => item.name)
  }

  /**
   * Short names (as the story uses them) of carried and room items mapped
   * to their full names, e.g. `{ journal: "Elior's Journal" }`. Each short
   * name is resolved through `GameState.findItem`, the same lookup the
   * parser's verbs use, so a shared short name maps to the item they pick.
   */
  getShortNames(): Record<string, string> {
    const state = this.game.state
    const shortNames: Record<string, string> = {}
    for (const item of [...state.inventory, ...state.currentRoom.items]) {
      const short = item.shortName.toLowerCase()
      const resolved = state.findItem(short)
      if (short !== item.name.toLowerCase() && resolved) {
        shortNames[short] = resolved.name
      }
    }
    return shortNames
  }

  /** Direction to the destination room's display name (or its key if unknown), or the room's own label for the way. */
  getRoomExits(): Record<string, string> {
    const rooms = this.game.state.allRooms
    const room = this.game.state.currentRoom
    const exits = room.getExits(this.game.state)
    return Object.fromEntries(
      Object.entries(exits).map(([direction, key]) => [
        direction,
        room.exitLabel(this.game.state, direction) ?? rooms[key]?.name ?? key,
      ]),
    )
  }

  isGameRunning(): boolean {
    return this.game.isRunning
  }

  /** The commands of act `actNumber`'s golden path; empty when it has none. */
  goldenPath(actNumber: number): string[] {
    return this.game.goldenPath(actNumber)
  }

  isActRunning(): boolean {
    return this.game.isActRunning()
  }

  /** True once the last act is complete. */
  isGameOver(): boolean {
    return this.game.isGameOver()
  }

  /**
   * The act's music once it runs, still under its closing pages and after
   * the game is over; empty before that so nothing plays early.
   */
  getCurrentMusic(): MusicInfo {
    return this.game.currentMusic()
  }

  /** The act and room the music plays in, for a track of its own; empty exactly when `getCurrentMusic` is. */
  getMusicPlace(): MusicPlace {
    return this.game.currentMusicPlace()
  }

  /** The intro of the act that follows while a closing page shows; null otherwise. */
  getNextActIntro(): string | null {
    return this.game.nextActIntro()
  }
}
