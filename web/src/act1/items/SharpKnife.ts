import { Item, type GameState } from '@/engine'
import { Snare } from './Snare'
import { Vines } from './Vines'

/** A sharp knife item that can be used to cut through vines and other obstacles. */
export class SharpKnife extends Item {
  constructor() {
    super({
      name: 'sharp knife',
      description:
        'A small kitchen knife, freshly sharpened by the blacksmith.',
      shortName: 'knife',
      canBeCarried: true,
    })
  }

  /** Delegate to Vines' or the snare's useWith if applicable, otherwise fallback. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Vines) {
      return other.useWith(gameState, this)
    }
    if (other instanceof Snare) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'The new edge catches the light. ' +
      'You hold it by the handle, and carefully.'
    )
  }
}
