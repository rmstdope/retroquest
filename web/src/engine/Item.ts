import type { Character } from './Character'
import type { GameState } from './GameState'

export interface ItemOptions {
  name: string
  description: string
  /** The name the story uses for the item; defaults to the full name. */
  shortName?: string
  canBeCarried?: boolean
}

/**
 * Base class for all items. Subclasses override the actions they answer to;
 * every action fails politely by default.
 */
export class Item {
  name: string
  description: string
  shortName: string
  canBeCarried: boolean

  constructor({ name, description, shortName, canBeCarried }: ItemOptions) {
    this.name = name
    this.description = description
    this.shortName = shortName ?? name
    this.canBeCarried = canBeCarried ?? false
  }

  /**
   * Whether the player's word for an item names this one: its full name or
   * short name, compared case-insensitively. Override to accept more names.
   */
  answersTo(name: string): boolean {
    const wanted = name.toLowerCase()
    return (
      this.name.toLowerCase() === wanted ||
      this.shortName.toLowerCase() === wanted
    )
  }

  /** Why the item cannot be taken, or '' when it can. */
  preventPickup(): string {
    return this.canBeCarried
      ? ''
      : `[failure]You can't take the [item_name]${this.name}[/item_name].[/failure]`
  }

  use(_gameState: GameState): string {
    return (
      `[failure]You can't use the [item_name]${this.name}[/item_name] in any ` +
      'special way.[/failure]'
    )
  }

  useWith(_gameState: GameState, other: Item): string {
    return (
      `[failure]You can't use the [item_name]${this.name}[/item_name] with ` +
      `the [item_name]${other.name}[/item_name].[/failure]`
    )
  }

  useOnCharacter(_gameState: GameState, target: Character): string {
    return (
      `[failure]You can't use the [item_name]${this.name}[/item_name] on ` +
      `[character_name]${target.name}[/character_name].[/failure]`
    )
  }

  examine(_gameState: GameState): string {
    return this.description
  }

  listen(_gameState: GameState): string {
    return `[failure]The [item_name]${this.name}[/item_name] is silent.[/failure]`
  }

  /** Called after the player takes the item; the text is shown after the pickup. */
  pickedUp(_gameState: GameState): string {
    return ''
  }

  open(_gameState: GameState): string {
    return `[failure]You can't open the [item_name]${this.name}[/item_name].[/failure]`
  }

  close(_gameState: GameState): string {
    return `[failure]You can't close the [item_name]${this.name}[/item_name].[/failure]`
  }

  /** Called by the grow spell. */
  grow(_gameState: GameState): string {
    return (
      `[failure]The [item_name]${this.name}[/item_name] does not respond to ` +
      'the [spell_name]grow[/spell_name] spell.[/failure]'
    )
  }

  eat(_gameState: GameState): string {
    return `[failure]You can't eat the [item_name]${this.name}[/item_name].[/failure]`
  }

  drink(_gameState: GameState): string {
    return `[failure]You can't drink the [item_name]${this.name}[/item_name].[/failure]`
  }

  equip(_gameState: GameState): string {
    return `[failure]You can't equip the [item_name]${this.name}[/item_name].[/failure]`
  }

  unequip(_gameState: GameState): string {
    return `[failure]You can't unequip the [item_name]${this.name}[/item_name].[/failure]`
  }
}
