import type { Character } from './Character'
import type { GameState } from './GameState'
import { nameInSentence, type NameOptions } from './names'

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

  /**
   * The item's name as it reads inside a sentence, article included (see
   * `nameInSentence` in `names.ts`): "the [item]", or a possessive name
   * without an article. Override only for a name that needs something else.
   */
  nameInSentence(options?: NameOptions): string {
    return nameInSentence('item', this.name, options)
  }

  /** Why the item cannot be taken, or '' when it can. */
  preventPickup(): string {
    return this.canBeCarried
      ? ''
      : `[failure]You can't take ${this.nameInSentence()}.[/failure]`
  }

  use(_gameState: GameState): string {
    return (
      `[failure]You can't use ${this.nameInSentence()} in any ` +
      'special way.[/failure]'
    )
  }

  useWith(_gameState: GameState, other: Item): string {
    return (
      `[failure]You can't use ${this.nameInSentence()} with ` +
      `${other.nameInSentence()}.[/failure]`
    )
  }

  useOnCharacter(_gameState: GameState, target: Character): string {
    return (
      `[failure]You can't use ${this.nameInSentence()} on ` +
      `${target.nameInSentence()}.[/failure]`
    )
  }

  examine(_gameState: GameState): string {
    return this.description
  }

  listen(_gameState: GameState): string {
    return `[failure]${this.nameInSentence({ atStart: true })} is silent.[/failure]`
  }

  /** Called after the player takes the item; the text is shown after the pickup. */
  pickedUp(_gameState: GameState): string {
    return ''
  }

  open(_gameState: GameState): string {
    return `[failure]You can't open ${this.nameInSentence()}.[/failure]`
  }

  close(_gameState: GameState): string {
    return `[failure]You can't close ${this.nameInSentence()}.[/failure]`
  }

  /** Called by the grow spell. */
  grow(_gameState: GameState): string {
    return (
      `[failure]${this.nameInSentence({ atStart: true })} does not respond to ` +
      'the [spell_name]grow[/spell_name] spell.[/failure]'
    )
  }

  eat(_gameState: GameState): string {
    return `[failure]You can't eat ${this.nameInSentence()}.[/failure]`
  }

  drink(_gameState: GameState): string {
    return `[failure]You can't drink ${this.nameInSentence()}.[/failure]`
  }

  equip(_gameState: GameState): string {
    return `[failure]You can't equip ${this.nameInSentence()}.[/failure]`
  }

  unequip(_gameState: GameState): string {
    return `[failure]You can't unequip ${this.nameInSentence()}.[/failure]`
  }
}
