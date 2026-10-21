import { Item, type GameState, event } from '@/engine'

/**
 * The silver mask the Sorceress of Lies hands over: proof that even a liar can
 * choose the truth. Its real use comes in the Memory Vault.
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
    return event(this.description)
  }

  /** For now it only waits; the same line everywhere. */
  override use(_gameState: GameState): string {
    return event(
      'You turn the mask over in your hands. Somewhere ahead is someone who ' +
        'needs to see that a liar can choose the truth.',
    )
  }
}
