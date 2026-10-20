/**
 * The read model a UI uses on top of Game: journal lists, room data, quest
 * pop-ups, progress and stats as plain data (names still carry engine markup).
 */
import type { Character } from './Character'
import type { Game } from './Game'
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

  handleCommand(command: string): string {
    return this.game.commandParser.parse(command)
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
    const state = this.game.finishedActState ?? this.game.state
    const quest = state.nextCompletedQuest()
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
    const finished = this.game.finishedActState
    const state = finished ?? this.game.state
    const actIndex = finished ? this.game.currentAct - 1 : this.game.currentAct
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
    const state = this.game.finishedActState ?? this.game.state
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
   * to their full names, e.g. `{ journal: "Elior's Journal" }`. A shared
   * short name maps to the item Game.findItem picks: the bag first, first match.
   */
  getShortNames(): Record<string, string> {
    const shortNames: Record<string, string> = {}
    const items = [
      ...this.game.state.inventory,
      ...this.game.state.currentRoom.items,
    ]
    for (const item of items) {
      const short = item.shortName.toLowerCase()
      if (
        short !== item.name.toLowerCase() &&
        !Object.hasOwn(shortNames, short)
      ) {
        shortNames[short] = item.name
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

  /** The act's music once it runs; empty before that so nothing plays early. */
  getCurrentMusic(): MusicInfo {
    if (!this.game.isActRunning()) return { musicFile: '', musicInfo: '' }
    const act = this.game.acts[this.game.currentAct]
    return { musicFile: act.musicFile, musicInfo: act.musicInfo }
  }
}
