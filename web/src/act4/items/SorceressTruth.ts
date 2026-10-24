import { Item, type Character, type GameState } from '@/engine'
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

  /** The mask's look. */
  override examine(_gameState: GameState): string {
    return this.description
  }

  /** In the Memory Vault the mask is shown to the Shadow; elsewhere it only waits. */
  override use(gameState: GameState): string {
    const room = gameState.currentRoom
    if (room instanceof MemoryVault) return room.showMask(gameState)
    return (
      'Somewhere ahead is someone who ' +
      'needs to see that a liar can choose the truth.'
    )
  }

  /** Shown to the Shadow, the mask does what it does in the vault. */
  override useOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof ShadowOfThePast) return this.use(gameState)
    return super.useOnCharacter(gameState, target)
  }
}
