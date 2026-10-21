import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { Vines } from '../items/Vines'
import { Bush } from '../items/Bush'
import { Snare } from '../items/Snare'

const BLOCKED_DESCRIPTION =
  'A winding path snakes into the heart of the woods, dappled sunlight ' +
  'flickering through the canopy above. A section of the path is blocked by ' +
  'thick, thorny vines. The air is alive with the scent of pine and wildflowers, ' +
  'and the ground is soft with moss and fallen leaves. Birds flit between ' +
  'branches, and the occasional snap of a twig hints at unseen creatures ' +
  'nearby. The path feels ancient, as if it remembers every footstep that has ' +
  'ever passed this way.'
const CLEARED_DESCRIPTION =
  'A winding path snakes into the heart of the woods, dappled sunlight ' +
  'flickering through the canopy above. Where thick vines once blocked a ' +
  'small alcove, they now lie cut, revealing the opening. The air is alive ' +
  'with the scent of pine and wildflowers, and the ground is soft with ' +
  'moss and fallen leaves. Birds flit between branches, and the occasional ' +
  'snap of a twig hints at unseen creatures nearby. The path feels ancient, ' +
  'as if it remembers every footstep that has ever passed this way.'
const KIT_CAUGHT_SENTENCE =
  " In the alcove a fox kit is caught in a poacher's snare, " +
  'too tired now to struggle.'
const SNARE_CUT_SENTENCE =
  " In the alcove lies a poacher's snare, cut and empty."

/**
 * Forest Path room: dynamic description corridor with a removable vine
 * obstacle. Once the vines are cut the alcove shows the fox kit caught in a
 * snare and, after it is freed, the cut, empty snare. `refreshDescription()`
 * rebuilds the text from the items in the room.
 */
export class ForestPath extends Room {
  constructor() {
    super({
      name: 'Forest Path',
      description: BLOCKED_DESCRIPTION,
      items: [new Vines(), new Bush()],
      characters: [],
      exits: { north: 'Riverbank', south: 'HiddenGlade' },
    })
  }

  /**
   * Describe the path with the vines while they remain; once they are cut,
   * with the opened alcove and what lies in it (the caught kit, or the cut
   * snare after it is freed).
   */
  refreshDescription(_gameState: GameState): void {
    if (this.items.some((item) => item instanceof Vines)) {
      this.description = BLOCKED_DESCRIPTION
      return
    }
    const snare = this.items.find((item) => item instanceof Snare)
    let alcove = ''
    if (snare instanceof Snare) {
      alcove = snare.freed ? SNARE_CUT_SENTENCE : KIT_CAUGHT_SENTENCE
    }
    this.description = CLEARED_DESCRIPTION + alcove
  }

  /** Refresh the description before describing the room. */
  override describe(gameState: GameState): string {
    this.refreshDescription(gameState)
    return super.describe(gameState)
  }
}
