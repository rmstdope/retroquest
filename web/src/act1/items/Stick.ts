import { Item, type GameState } from '@/engine'
import { MagneticFishingRod } from './MagneticFishingRod'

/** A simple stick useful for poking, walking, or combining with tools. */
export class Stick extends Item {
  constructor() {
    super({
      name: 'stick',
      description:
        'A sturdy stick, perfect for walking, poking, or perhaps as a makeshift ' +
        'weapon.',
      canBeCarried: true,
    })
  }

  /** Delegate to MagneticFishingRod's useWith if applicable, otherwise fallback. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof MagneticFishingRod) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
