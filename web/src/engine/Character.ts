import type { GameState } from './GameState'
import type { Item } from './Item'
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

  examine(_gameState: GameState): string {
    return this.description
  }

  /**
   * The player talks to the character. By default it has nothing to say, the
   * sentence opening with the name in title case (see `titleCase`).
   */
  talkTo(_gameState: GameState): string {
    return `[character_name]${titleCase(this.name)}[/character_name] has nothing to say right now.`
  }

  /** The player says specific words to the character. */
  sayTo(_gameState: GameState, words: string): string {
    return (
      `[dialogue]You say '${words}' to [character_name]${this.name}[/character_name], ` +
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
   * sentence opening with the name in title case (see `titleCase`).
   */
  giveItem(_gameState: GameState, item: Item): string {
    return (
      `[character_name]${titleCase(this.name)}[/character_name] doesn't seem interested in the ` +
      `[item_name]${item.name}[/item_name].`
    )
  }

  /**
   * The player asks to buy an item. By default the character sells nothing,
   * the sentence opening with the name in title case (see `titleCase`).
   */
  buyItem(_gameState: GameState, itemName: string): string {
    return (
      `[character_name]${titleCase(this.name)}[/character_name] does not have any ` +
      `[item_name]${itemName}[/item_name] to sell right now.`
    )
  }
}

/** Words a title keeps lowercase ("Captain of the Guard"). */
const MINOR_WORDS = ['of', 'the']

/**
 * A character's parser name as it reads at the start of a sentence: every
 * word capitalised except the minor ones ("barmaid elena" -> "Barmaid Elena").
 */
function titleCase(name: string): string {
  return name
    .split(' ')
    .map((word, i) =>
      i > 0 && MINOR_WORDS.includes(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}
