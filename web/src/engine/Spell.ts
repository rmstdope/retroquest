import type { Character } from './Character'
import type { GameState } from './GameState'
import type { Item } from './Item'

export interface SpellOptions {
  name: string
  description: string
}

/** Base class for all spells. Subclasses override the casts they support. */
export class Spell {
  name: string
  description: string

  constructor({ name, description }: SpellOptions) {
    this.name = name
    this.description = description
  }

  /** Cast without a target. */
  castSpell(_gameState: GameState): string {
    return `[failure]You cast [spell_name]${this.name}[/spell_name], but nothing happens.[/failure]`
  }

  castOnItem(_gameState: GameState, target: Item): string {
    return (
      `[failure]You attempt to cast [spell_name]${this.name}[/spell_name] on ` +
      `[item_name]${target.name}[/item_name], but the spell fizzles and ` +
      'does not seem to work on this item.[/failure]'
    )
  }

  castOnCharacter(_gameState: GameState, target: Character): string {
    return (
      `[failure]You attempt to cast [spell_name]${this.name}[/spell_name] on ` +
      `[character_name]${target.name}[/character_name], but the spell ` +
      'fizzles and does not seem to work on this character.[/failure]'
    )
  }
}
