import type { GameState } from './GameState'
import type { Item } from './Item'

export interface CharacterOptions {
  name: string
  description: string
}

/** Base class for all characters (NPCs). Subclasses override the interactions. */
export class Character {
  name: string
  description: string

  constructor({ name, description }: CharacterOptions) {
    this.name = name
    this.description = description
  }

  /**
   * Whether the player's word for a character names this one; by default
   * its name, compared case-insensitively. Override to accept other names.
   */
  answersTo(name: string): boolean {
    return this.name.toLowerCase() === name.toLowerCase()
  }

  examine(_gameState: GameState): string {
    return (
      `[event]You examine [character_name]${this.name}[/character_name]. ` +
      `${this.description}[/event]`
    )
  }

  talkTo(_gameState: GameState): string {
    return (
      `[event]You speak with the [character_name]${this.name}[/character_name].[/event]\n` +
      `[character_name]${this.name}[/character_name] has nothing to say right now.`
    )
  }

  /** The player says specific words to the character. */
  sayTo(_gameState: GameState, words: string): string {
    return (
      `[dialogue]You say '${words}' to [character_name]${this.name}[/character_name], ` +
      "but they don't seem to understand or respond to that particular phrase." +
      '[/dialogue]'
    )
  }

  giveItem(_gameState: GameState, item: Item): string {
    return (
      `[event]You offer the [item_name]${item.name}[/item_name] to the ` +
      `[character_name]${this.name}[/character_name].[/event]\n` +
      `[character_name]${this.name}[/character_name] doesn't seem interested in the ` +
      `[item_name]${item.name}[/item_name].`
    )
  }

  buyItem(_gameState: GameState, itemName: string): string {
    return (
      `[event]You try to buy the [item_name]${itemName}[/item_name] from the ` +
      `[character_name]${this.name}[/character_name].[/event]\n` +
      `[character_name]${this.name}[/character_name] does not have any ` +
      `[item_name]${itemName}[/item_name] to sell right now.`
    )
  }
}
