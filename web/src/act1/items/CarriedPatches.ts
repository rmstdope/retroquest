import { Item, type GameState, type NameOptions, type RingVerb } from '@/engine'
import { Patches } from '../characters/Patches'
import {
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
} from '../Act1StoryFlags'

/** What Patches says when she is used with anyone or anything but her homes. */
const TUCK_LINE =
  'Patches tucks her head under your chin. ' +
  'She has had enough of strangers for one day.'

/** What Patches does when a thing is used with her. */
const SNIFF_LINE = 'Patches sniffs it, then settles back into your arms.'

/**
 * Patches while Elior carries her: the first pocket of the bag from the moment
 * she comes out in the Abandoned Shed until he hands her to Hemlock or to his
 * grandmother. The story flags stay the truth of where she is; this item only
 * lets the bag, the rings and Use with… treat her like anything carried.
 */
export class CarriedPatches extends Item {
  constructor() {
    super({
      name: 'Patches',
      description: new Patches().description,
      // Carried, so the belt lists her picture; she is never in a room to take.
      canBeCarried: true,
    })
  }

  /** She is named like a person: no "the" before her name in a sentence. */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, bare: true })
  }

  /** She is in his arms already; her ring has no verbs of its own. */
  override ringVerbs(): readonly RingVerb[] {
    return []
  }

  /** Used with another thing, she only tucks her head under his chin. */
  override useWith(_gameState: GameState, _other: Item): string {
    return TUCK_LINE
  }

  /** A thing used with her gets a sniff, then she settles. */
  override answerUseFrom(_gameState: GameState, _item: Item): string {
    return SNIFF_LINE
  }

  /** Used with anyone but her two homes, she only tucks her head. */
  override useOnCharacter(): string {
    return TUCK_LINE
  }

  /** Take her out of the bag once she has a home. */
  static release(gameState: GameState): void {
    gameState.inventory = gameState.inventory.filter(
      (item) => !(item instanceof CarriedPatches),
    )
  }

  /**
   * Put her first in the bag of a save made while Elior carried her before
   * she had a pocket: found, not yet home, and not yet in the bag.
   */
  static restore(gameState: GameState): void {
    const carrying =
      gameState.getStoryFlag(FLAG_PATCHES_FOUND) &&
      !gameState.getStoryFlag(FLAG_PATCHES_RETURNED) &&
      !gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)
    if (
      carrying &&
      !gameState.inventory.some((item) => item instanceof CarriedPatches)
    ) {
      gameState.inventory.unshift(new CarriedPatches())
    }
  }
}
