import { Item, type GameState } from '@/engine'
import { MagneticFishingRod } from './MagneticFishingRod'

/** A plain stick; with the magnet it makes a fishing rod. */
export class Stick extends Item {
  constructor() {
    super({
      name: 'stick',
      description: 'A straight stick, sound all the way through.',
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

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is straight and sound, and about the right length. ' +
      'A good stick is worth keeping.'
    )
  }
}
