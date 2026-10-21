import type { Character } from './Character'
import type { GameState } from './GameState'
import type { Item } from './Item'
import { isNamed } from './itemNames'

/** Direction → key of the destination room in the act's rooms. */
export type Exits = Record<string, string>

export interface RoomOptions {
  name: string
  description: string
  items?: Item[]
  characters?: Character[]
  exits?: Exits
}

/** Base class for all rooms. Subclasses override exits, search, rest and hooks. */
export class Room {
  name: string
  description: string
  items: Item[]
  characters: Character[]
  exits: Exits

  constructor({ name, description, items, characters, exits }: RoomOptions) {
    this.name = name
    this.description = description
    this.items = items ?? []
    this.characters = characters ?? []
    this.exits = exits ?? {}
  }

  addItem(item: Item): void {
    this.items.push(item)
  }

  addCharacter(character: Character): void {
    this.characters.push(character)
  }

  /** The exits available right now; override for exits that depend on the state. */
  getExits(_gameState: GameState): Exits {
    return this.exits
  }

  /**
   * The story line shown when the player tries a direction that is not an
   * open exit, or null for the plain "can't go that way". Override for
   * barred ways that explain themselves; the hook may also set story flags.
   */
  blockedExit(_gameState: GameState, _direction: string): string | null {
    return null
  }

  getAmbientSound(): string {
    return 'It is quiet here.'
  }

  /** The first item in the room named by full or short name, or null. */
  getItemByName(itemName: string): Item | null {
    return this.items.find((item) => isNamed(item, itemName)) ?? null
  }

  /** The first character in the room that answers to the name, or null. */
  getCharacterByName(characterName: string): Character | null {
    return (
      this.characters.find((character) => character.answersTo(characterName)) ??
      null
    )
  }

  /** Remove the first item with the name and return it, or null if there is none. */
  removeItem(itemName: string): Item | null {
    const item = this.getItemByName(itemName)
    if (item) this.items.splice(this.items.indexOf(item), 1)
    return item
  }

  /**
   * The text shown for the room itself, by `describe` and by the interface's
   * room card. Rooms whose text changes with the story override this; the
   * default is the plain description.
   */
  descriptionFor(_gameState: GameState): string {
    return this.description
  }

  /** The full description with items (counted), characters and exits. */
  describe(gameState: GameState): string {
    let desc = `[bold]${this.name}[/bold]\n${this.descriptionFor(gameState)}\n`
    if (this.items.length > 0) {
      const counts = new Map<string, number>()
      for (const item of this.items) {
        counts.set(item.name, (counts.get(item.name) ?? 0) + 1)
      }
      const names = [...counts]
        .map(([name, count]) =>
          count > 1
            ? `[item_name]${count} ${name}[/item_name]`
            : `[item_name]${name}[/item_name]`,
        )
        .join(', ')
      desc += `\nItems you can see: ${names}`
    }
    if (this.characters.length > 0) {
      const names = this.characters
        .map((c) => `[character_name]${c.name}[/character_name]`)
        .join(', ')
      desc += `\nCharacters present: ${names}`
    }
    const exits = Object.entries(this.getExits(gameState))
    if (exits.length > 0) {
      const names = exits
        .map(
          ([direction, destination]) =>
            `[exits]${direction}[/exits] (${destination})`,
        )
        .join(', ')
      desc += `\nExits: ${names}`
    }
    return desc
  }

  search(_gameState: GameState): string {
    return (
      `You search around the [room_name]${this.name}[/room_name], but find nothing ` +
      'of interest beyond what you can already see.'
    )
  }

  rest(_gameState: GameState): string {
    return 'You rest for a moment, gathering your strength.'
  }

  light(_gameState: GameState): string {
    return 'The room is already well lit.'
  }

  /** Called when the player enters the room. */
  onEnter(_gameState: GameState): void {}
}
