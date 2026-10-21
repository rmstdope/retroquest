import { Item, type Character, type GameState, event } from '@/engine'
import { Malakar } from '../characters/Malakar'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
} from '../Act4StoryFlags'
import { endingPlayed } from '../endings'
import { VaultDoor } from './VaultDoor'
import { Wound } from './Wound'

/** The first two sentences of the amulet's look, which never change. */
const PICTURE_HEAD =
  'A family heirloom whose runes glint like dew at dawn. In its depths ' +
  'Aren and Lysa stand hand in hand. '

/** The last sentence of the look, in the order of the stages the story reaches. */
const THIRD_FIGURE_STAGES = [
  'The third figure keeps his back turned.',
  'The third figure has turned around. He is young, and he is smiling at them.',
  'The third figure is Malakar as he is now: white-haired, grey-robed, a ' +
    'step behind them.',
  'The three of them stand together at a workbench, heads bent over ' +
    'something you cannot quite see.',
]

/**
 * Elior's heirloom, carried from the first turn of Act IV. It is the key to
 * the sealed door in the Memory Vault (see VaultDoor); alone it only shows the picture Act III left in it.
 */
export class AncientAmulet extends Item {
  constructor() {
    super({
      name: 'ancient amulet',
      shortName: 'amulet',
      description: PICTURE_HEAD + THIRD_FIGURE_STAGES[0],
      canBeCarried: true,
    })
  }

  /**
   * The amulet's look: the picture of the third figure follows the story
   * (orbs mended, refrain said, Redemption). Justice and Sacrifice stay at
   * the Throne Chamber stage.
   */
  override examine(gameState: GameState): string {
    let stage = 0
    if (endingPlayed(gameState) === 'redemption') stage = 3
    else if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) stage = 2
    else if (gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) stage = 1
    return event(PICTURE_HEAD + THIRD_FIGURE_STAGES[stage])
  }

  /**
   * Used with the Memory Vault's sealed door, it opens it (once the Shadow
   * is answered); used on the wound, it closes it in Justice or Sacrifice.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof VaultDoor) return other.openWith(gameState)
    if (other instanceof Wound) return other.closeWithAmulet(gameState)
    return super.useWith(gameState, other)
  }

  /** Used alone in the Throne Chamber, it plays the third step of the scene. */
  override use(gameState: GameState): string {
    const malakar = gameState.currentRoom.characters.find(
      (character) => character instanceof Malakar,
    )
    if (malakar instanceof Malakar) return malakar.openAmulet(gameState)
    return super.use(gameState)
  }

  /** Used on Malakar, the same as using it alone in his chamber. */
  override useOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof Malakar) return target.openAmulet(gameState)
    return super.useOnCharacter(gameState, target)
  }
}
