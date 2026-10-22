import type { Character } from './Character'
import type { GameState } from './GameState'
import type { Item } from './Item'

/** Construction options: `id` is the identifier, `name` the text a player reads. */
export interface SpellOptions {
  id: string
  name: string
  description: string
}

/** Base class for all spells. Subclasses override the casts they support. */
export class Spell {
  /** Stable identifier used for lookups (`prophetic_vision`); never shown. */
  id: string
  /** The name a player reads and types (`prophetic vision`). */
  name: string
  description: string

  constructor({ id, name, description }: SpellOptions) {
    this.id = id
    this.name = name
    this.description = description
  }

  /** Whether typed text names this spell: its id or its shown name, any case. */
  answersTo(text: string): boolean {
    const wanted = text.trim().toLowerCase()
    return (
      this.id.toLowerCase() === wanted || this.name.toLowerCase() === wanted
    )
  }

  /** Cast without a target. */
  castSpell(_gameState: GameState): string {
    return `[failure]You cast [spell_name]${this.name}[/spell_name], but nothing happens.[/failure]`
  }

  castOnItem(_gameState: GameState, target: Item): string {
    return (
      `[failure]You cast [spell_name]${this.name}[/spell_name] on the ` +
      `[item_name]${target.name}[/item_name]. Nothing in it answers the ` +
      'spell.[/failure]'
    )
  }

  /**
   * Cast on a target that is neither an item nor a character in reach, named
   * as typed (lower case). Return the story text, or null when the spell has
   * nothing there, which leaves the usual "You don't see ..." failure.
   */
  castOnName(_gameState: GameState, _target: string): string | null {
    return null
  }

  castOnCharacter(_gameState: GameState, target: Character): string {
    return (
      `[failure]You cast [spell_name]${this.name}[/spell_name] on ` +
      `[character_name]${target.name}[/character_name]. Nothing in them ` +
      'answers the spell.[/failure]'
    )
  }
}
