import { Item, type GameState } from '@/engine'
import { FishingRod } from './FishingRod'

/** Small, strong magnet used for retrieval puzzles and crafting upgrades. */
export class Magnet extends Item {
  constructor() {
    super({
      name: 'magnet',
      description:
        'A small, surprisingly strong magnet. It might be useful for retrieving ' +
        'metallic objects from hard-to-reach places.',
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
}
