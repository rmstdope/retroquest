import { Item, type GameState } from '@/engine'
import { FishingRod } from './FishingRod'

/** Small, strong magnet used for retrieval puzzles and crafting upgrades. */
export class Magnet extends Item {
  constructor() {
    super({
      name: 'magnet',
      description: 'A small magnet, stronger than it looks.',
      canBeCarried: true,
    })
  }

  /** Delegate to FishingRod's useWith if applicable, otherwise fallback. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof FishingRod) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It snaps to the nearest bit of iron and has to be pulled free. ' +
      'Small as it is, it does not let go easily.'
    )
  }
}
