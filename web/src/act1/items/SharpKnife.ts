import { Item, type GameState } from '@/engine'
import { Vines } from './Vines'

/** A sharp knife item that can be used to cut through vines and other obstacles. */
export class SharpKnife extends Item {
  constructor() {
    super({
      name: 'sharp knife',
      description:
        'A well-sharpened knife. It looks like it could cut through ' +
        'almost anything.',
      shortName: 'knife',
      canBeCarried: true,
    })
  }

  /** Delegate to Vines' useWith if applicable, otherwise fallback. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Vines) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
