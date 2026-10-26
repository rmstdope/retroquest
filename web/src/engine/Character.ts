import type { GameState } from './GameState'
import type { Item } from './Item'
import { nameInSentence, type NameOptions } from './names'
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
   * marked up (see `nameInSentence` in `names.ts`). Override and pass
   * `common: true` for a character named by what it is ("the merchant"), and
   * override `isPlural` too when it names several ("the families").
   */
  nameInSentence(options?: NameOptions): string {
    return nameInSentence('character', this.name, options)
  }

  /**
   * Whether the name stands for several ("the families"), so the default
   * replies take plural verbs. Override to return true for a group.
   */
  isPlural(): boolean {
    return false
  }

  /** The verb that agrees with the character: `singular`, or `plural` for a group. */
  protected verb(singular: string, plural: string): string {
    return this.isPlural() ? plural : singular
  }

  examine(_gameState: GameState): string {
    return this.description
  }

  /**
   * The player talks to the character. By default it has nothing to say, the
   * sentence opening with the name (see `nameInSentence`) and the verb agreeing
   * with it (see `isPlural`).
   */
  talkTo(_gameState: GameState): string {
    return `${this.nameInSentence({ atStart: true })} ${this.verb('has', 'have')} nothing to say right now.`
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
   * sentence opening with the name (see `nameInSentence`) and the verb agreeing
   * with it (see `isPlural`).
   */
  giveItem(_gameState: GameState, item: Item): string {
    return (
      `${this.nameInSentence({ atStart: true })} ` +
      `${this.verb("doesn't", "don't")} seem interested in ` +
      `${item.nameInSentence()}.`
    )
  }

  /**
   * The player asks to buy an item. By default the character sells nothing;
   * the reply names who answered, never the item, so one line serves every
   * item, and opens with the name (see `nameInSentence`), the verb agreeing
   * with it (see `isPlural`).
   */
  buyItem(_gameState: GameState, _itemName: string): string {
    return `${this.nameInSentence({ atStart: true })} ${this.verb('has', 'have')} nothing to sell you.`
  }
}
