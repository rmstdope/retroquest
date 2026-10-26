import type { GameState } from './GameState'
import type { Item } from './Item'
import { nameInSentence } from './names'
import type { Spell } from './Spell'

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

  /**
   * The character's name as it reads inside a sentence: title-cased and
   * marked up (see `nameInSentence` in `names.ts`).
   */
  nameInSentence(): string {
    return nameInSentence('character', this.name)
  }

  examine(_gameState: GameState): string {
    return this.description
  }

  /**
   * The player talks to the character. By default it has nothing to say, the
   * sentence opening with the name in title case (see `nameInSentence`).
   */
  talkTo(_gameState: GameState): string {
    return `${this.nameInSentence()} has nothing to say right now.`
  }

  /** The player says specific words to the character. */
  sayTo(_gameState: GameState, words: string): string {
    return (
      `[dialogue]You say '${words}' to ${this.nameInSentence()}, ` +
      "but they don't seem to understand or respond to that particular phrase." +
      '[/dialogue]'
    )
  }

  /**
   * A spell the player casts on this character, offered before the spell's own
   * `castOnCharacter`. Return the story text to take over the cast, or null
   * (the default) to let the spell act as usual.
   */
  receiveSpell(_gameState: GameState, _spell: Spell): string | null {
    return null
  }

  /**
   * The player offers an item. By default the character refuses it, the
   * sentence opening with the name in title case (see `nameInSentence`).
   */
  giveItem(_gameState: GameState, item: Item): string {
    return (
      `${this.nameInSentence()} doesn't seem interested in ` +
      `${item.nameInSentence()}.`
    )
  }

  /**
   * The player asks to buy an item. By default the character sells nothing;
   * the reply names who answered, never the item, so one line serves every
   * item, and opens with the name in title case (see `nameInSentence`).
   */
  buyItem(_gameState: GameState, _itemName: string): string {
    return `${this.nameInSentence()} has nothing to sell you.`
  }
}
