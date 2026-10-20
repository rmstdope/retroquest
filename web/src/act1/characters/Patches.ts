import {
  Character,
  type GameState,
  type Item,
  characterName,
  event,
} from '@/engine'
import { Egg } from '../items/Egg'
import { Fish } from '../items/Fish'
import {
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
} from '../Act1StoryFlags'

/**
 * Patches, the Hemlock family's missing cat. She hides behind the crates of
 * the Abandoned Shed once it is unlocked, comes out when called by name or
 * tempted with something smelly, and is carried home to the General Store,
 * where she settles on the counter, or, if Elior lets her stay with his
 * grandmother, by the cottage hearth.
 */
export class Patches extends Character {
  constructor() {
    super({
      name: 'Patches',
      description:
        'A small cat with a patchwork coat of ginger, black and white, ' +
        'and wide green eyes.',
    })
  }

  /** Call her by name: coax her out of hiding, or hear her purr once home. */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_PATCHES_FOUND)) return this.purr(gameState)
    return (
      event(
        `You crouch by the crates and call softly for ${characterName(this.name)}.`,
      ) +
      '\n' +
      this.comeOut(gameState)
    )
  }

  /** Saying her name coaxes her out like calling her; other words spook her. */
  override sayTo(gameState: GameState, words: string): string {
    if (
      !gameState.getStoryFlag(FLAG_PATCHES_FOUND) &&
      words.toLowerCase().includes('patches')
    ) {
      return (
        event(
          `You say ${characterName(this.name)}'s name gently into the shadows.`,
        ) +
        '\n' +
        this.comeOut(gameState)
      )
    }
    return (
      `${characterName(this.name)} flicks an ear at you, ` +
      'but the words mean nothing to her.'
    )
  }

  /**
   * Something smelly, the egg or the fish, coaxes her out; Elior keeps it.
   * Anything else only gets a sniff.
   */
  override giveItem(gameState: GameState, item: Item): string {
    const offer = event(
      `You hold out the [item_name]${item.name}[/item_name] to ${characterName(this.name)}.`,
    )
    if (gameState.getStoryFlag(FLAG_PATCHES_FOUND)) {
      return offer + '\n' + this.purr(gameState)
    }
    if (item instanceof Egg || item instanceof Fish) {
      return (
        offer +
        '\nA small nose twitches behind the crates. ' +
        'Curiosity gets the better of her.\n' +
        this.comeOut(gameState)
      )
    }
    return (
      offer +
      '\nShe sniffs at it from the shadows and stays put. ' +
      'Perhaps she would rather hear her name.'
    )
  }

  /** She creeps out, lets Elior pick her up and leaves the room in his arms. */
  private comeOut(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_PATCHES_FOUND, true)
    const room = gameState.currentRoom
    room.characters = room.characters.filter((c) => c !== this)
    return (
      'A pair of green eyes blinks in the dark. With a small, uncertain mew, ' +
      `${characterName(this.name)} creeps out, sniffs your fingers and lets ` +
      'you scoop her up. She is thin and dusty, but unhurt.\n' +
      event(
        `You carry ${characterName(this.name)} in your arms. ` +
          `Old Man ${characterName('Hemlock')} at the ` +
          '[room_name]General Store[/room_name] will be glad to see her.',
      )
    )
  }

  /** Her answer once she is safely home, at the store or by the hearth. */
  private purr(gameState: GameState): string {
    const spot = gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)
      ? 'beside the hearth'
      : 'the counter'
    return (
      `${characterName(this.name)} blinks at you slowly from ${spot} ` +
      'and begins to purr.'
    )
  }
}
