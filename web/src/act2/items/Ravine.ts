import { Item, type GameState } from '@/engine'
import { QualityRope } from './QualityRope'

/** A steep ravine discovered through nature sense or forest speech. This geographic feature cannot be carried. */
export class Ravine extends Item {
  constructor() {
    super({
      name: 'ravine',
      description:
        'A steep, rocky ravine that cuts deep into the forest floor. The walls ' +
        'are too treacherous to climb safely without proper equipment.',
      canBeCarried: false,
    })
  }

  override examine(_gameState: GameState): string {
    return (
      'Looking down into the ravine, you can see the remnants of a merchant caravan ' +
      'trapped at the bottom. The wooden wagon wheels are visible among the rocks, ' +
      'and you can hear faint voices calling for help. The walls are ' +
      'sheer and loose; nobody climbs down those by hand.'
    )
  }

  /** Handle using the ravine with other items. Delegates to Quality Rope if applicable. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof QualityRope) {
      // Delegate to the Quality Rope's useWith method, passing ravine as the target
      return other.useWith(gameState, this)
    }
    return `You can't use the ravine with ${other.nameInSentence()}.`
  }
}
