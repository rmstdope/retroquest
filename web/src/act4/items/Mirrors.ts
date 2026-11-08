import { Item, type GameState } from '@/engine'
import { EchoStone } from './EchoStone'
import { ServantsPendant } from './ServantsPendant'

/**
 * The false mirrors of the Mirror Labyrinth: scenery to examine, and what the
 * pendant and the echo stone are held up to.
 */
export class Mirrors extends Item {
  constructor() {
    super({
      name: 'Mirrors',
      description:
        'Each mirror shows a different Elior — older, younger, crowned, ' +
        'broken — with a different corridor stretching away behind him. ' +
        'Every path looks real. Most of them are lies.',
      canBeCarried: false,
    })
  }

  /** Examine the mirrors. */
  override examine(_gameState: GameState): string {
    return this.description
  }

  /** The pendant or the stone used with the mirrors: the same as using it alone. */
  override answerUseFrom(gameState: GameState, item: Item): string {
    if (item instanceof ServantsPendant || item instanceof EchoStone) {
      return item.use(gameState)
    }
    return ''
  }

  /** The mirrors named first: the same answer as naming the item first. */
  override useWith(gameState: GameState, other: Item): string {
    return (
      this.answerUseFrom(gameState, other) || super.useWith(gameState, other)
    )
  }
}
