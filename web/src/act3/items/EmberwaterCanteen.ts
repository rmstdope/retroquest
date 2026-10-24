import { Item, type GameState } from '@/engine'
import { BrassMirrorSegment } from './BrassMirrorSegment'

/**
 * A travel-worn canteen holding traces of past expeditions. Examining it once
 * reveals a loose brass mirror segment tucked into its lining.
 */
export class EmberwaterCanteen extends Item {
  private gaveSegment = false

  constructor() {
    super({
      name: 'Emberwater Canteen',
      description:
        'A dented canteen whose interior bears the faint smell of ash and ' +
        'old boiling herbs. A strip of brass peeks from a fold in the ' +
        'lining.',
      shortName: 'Canteen',
      canBeCarried: true,
    })
  }

  /**
   * Examine the canteen; the first time it yields a Brass Mirror Segment, which
   * is placed in the current room so the player must take it from the ground.
   */
  override examine(gameState: GameState): string {
    const lore =
      "The canteen's lining is scorched and patched; someone once used it to " +
      'carry boiled ash and broth between camps. A folded scrap of brass is ' +
      'stitched into the seam — a useful fragment for repairing a mirror.'
    if (!this.gaveSegment) {
      const segment = new BrassMirrorSegment()
      // Place the segment into the current room so the player must take it
      // from the ground; do not add directly to inventory.
      gameState.currentRoom.items.push(segment)
      this.gaveSegment = true
      return (
        `${lore} You pry free a [item_name]${segment.name}` +
        '[/item_name] from the lining; it falls to the ground nearby.'
      )
    }

    return lore
  }
}
