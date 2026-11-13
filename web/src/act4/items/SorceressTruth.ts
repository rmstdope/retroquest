import { Item, type Character, type GameState } from '@/engine'
import { FLAG_ACT4_SHADOW_MASK_SHOWN } from '../Act4StoryFlags'
import { ShadowOfThePast } from '../characters/ShadowOfThePast'
import { MemoryVault } from '../rooms/MemoryVault'

/**
 * The silver mask the Sorceress of Lies hands over: proof that even a liar can
 * choose the truth. Shown to the Shadow in the Memory Vault, it is the proof
 * the Shadow needs.
 */
export class SorceressTruth extends Item {
  constructor() {
    super({
      name: "Sorceress's Truth",
      description:
        'The silver mask from her staff, smooth and smiling, with no eyes ' +
        'behind it. In your hands it is only metal: a lie she no longer ' +
        'needs, given as proof that even a liar can choose the truth.',
      canBeCarried: true,
    })
  }

  /** Also answers to "mask" and "silver mask", what the story calls it. */
  override otherNames(): string[] {
    return ['mask', 'silver mask']
  }

  /** The mask's look. */
  override examine(_gameState: GameState): string {
    return this.description
  }

  /** In the Memory Vault the mask is shown to the Shadow; elsewhere it waits until it has been. */
  override use(gameState: GameState): string {
    const room = gameState.currentRoom
    if (room instanceof MemoryVault) return room.showMask(gameState)
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_MASK_SHOWN)) {
      return (
        'You turn the mask over in your hands. The Shadow has seen it and ' +
        'given it back. It has nothing left to prove.'
      )
    }
    return (
      'You turn the mask over in your hands. Somewhere ahead is someone who ' +
      'needs to see that a liar can choose the truth.'
    )
  }

  /** Shown to the Shadow, the mask does what it does in the vault. */
  override useOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof ShadowOfThePast) return this.use(gameState)
    return super.useOnCharacter(gameState, target)
  }
}
