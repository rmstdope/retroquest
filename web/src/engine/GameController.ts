/**
 * The read model a UI uses on top of Game: journal lists, room data, quest
 * pop-ups, progress and stats as plain data (names still carry engine markup).
 */
import type { Character } from './Character'
import type { CompletionTree, Game } from './Game'
import type { Item } from './Item'
import type { Quest } from './Quest'

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

function questType(quest: Quest): 'main' | 'side' {
  return quest.isMain() ? 'main' : 'side'
}

/** The pop-up text for a quest event. */
function questPopup(quest: Quest, text: string): string {
  return `[quest_name]${quest.name} (${questType(quest)} quest)[/quest_name]\n\n${text}`
}

export class GameController {
  constructor(readonly game: Game) {}

  /** The first text to show (the logo). */
  start(): string {
    return this.game.getResultText()
  }

  /** Parse a command and answer it, without starting a new turn (stats, help). */
  handleCommand(command: string): string {
    return this.game.commandParser.parse(command)
  }

  /** Play a command: parse it, then start the next turn. */
  takeTurn(command: string): string {
    const result = this.handleCommand(command)
    this.game.newTurn()
    return result
  }

  /** The current result text, then a new turn (the logo and intro screens). */
  advanceTurn(): string {
    const text = this.game.getResultText()
    this.game.newTurn()
    return text
  }

  /** The texts of the logo and intro screens, then the running act's first text. */
  advanceToRunning(): string[] {
    const results: string[] = []
    while (!this.game.isActRunning()) {
      results.push(this.advanceTurn())
    }
    results.push(this.game.getResultText())
    return results
  }

  /** The current run state's text, without a new turn. */
  getResultText(): string {
    return this.game.getResultText()
  }

  /** True while the game takes a typed command. */
  isAcceptingInput(): boolean {
    return this.game.acceptInput
  }

  /** The command words the game would accept next, as a tree. */
  getCommandCompletions(): CompletionTree {
    return this.game.getCommandCompletions()
  }

  getActiveQuests(): NamedItem[] {
    return this.game.state.activatedQuests.map((quest) => ({
      name: `[quest_name]${quest.name} (${questType(quest)})[/quest_name]`,
      description: quest.description,
    }))
  }

  getCompletedQuests(): NamedItem[] {
    return this.game.state.completedQuests.map((quest) => ({
      name: `[quest_name]${quest.name} (${questType(quest)})[/quest_name]`,
      description: `[dim]${quest.completion}[/dim]`,
    }))
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

  look(): string {
    return this.game.look()
  }

  /**
   * The pop-up for a quest that just completed, or null. Between acts this
   * reports the finished act, whose last completion ends it in the same turn.
   */
  completeQuest(): string | null {
    const quest = this.game.presentedState().nextCompletedQuest()
    return quest ? questPopup(quest, quest.completion) : null
  }

  /** The pop-up for a quest whose log just changed, or null. */
  updateQuest(): string | null {
    const quest = this.game.state.nextUpdatedQuest()
    return quest ? questPopup(quest, quest.description) : null
  }

  /** The pop-up for a quest that just started, or null (also while no act runs). */
  activateQuest(): string | null {
    if (!this.game.isActRunning()) return null
    const quest = this.game.state.nextActivatedQuest()
    return quest ? questPopup(quest, quest.description) : null
  }

  getRoomName(): string {
    return this.game.state.currentRoom.name
  }

  getActName(): string {
    return this.game.getActName()
  }

  /** Quest progress of the act; between acts, of the act that just ended. */
  getQuestProgress(): QuestProgress {
    const state = this.game.presentedState()
    const actIndex = this.game.presentedActIndex()
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
    const state = this.game.presentedState()
    return {
      questsCompleted: progress.completed,
      questsTotal: progress.total,
      spells: state.knownSpells.length,
      places: state.visitedRooms.length,
    }
  }

  getRoomDescription(): string {
    return this.game.state.currentRoom.description
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

  /** Direction to the destination room's display name (or its key if unknown). */
  getRoomExits(): Record<string, string> {
    const rooms = this.game.state.allRooms
    const exits = this.game.state.currentRoom.getExits(this.game.state)
    return Object.fromEntries(
      Object.entries(exits).map(([direction, key]) => [
        direction,
        rooms[key]?.name ?? key,
      ]),
    )
  }

  isGameRunning(): boolean {
    return this.game.isRunning
  }

  isActRunning(): boolean {
    return this.game.isActRunning()
  }

  /** True once the last act is complete. */
  isGameOver(): boolean {
    return this.game.isGameOver()
  }

  /**
   * The act's music once it runs, and still after the game is over; empty
   * before that so nothing plays early.
   */
  getCurrentMusic(): MusicInfo {
    return this.game.presentedMusic()
  }
}
