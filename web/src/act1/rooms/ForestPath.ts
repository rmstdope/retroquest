import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { Vines } from '../items/Vines'
import { Bush } from '../items/Bush'

/**
 * Forest Path room: dynamic description corridor with removable vine obstacle.
 *
 * The presence of the Vines item decides the wording of `getDescription()`.
 */
export class ForestPath extends Room {
  constructor() {
    super({
      name: 'Forest Path',
      description:
        'A winding path snakes into the heart of the woods, dappled sunlight ' +
        'flickering through the canopy above. A section of the path is blocked by ' +
        'thick, thorny vines. The air is alive with the scent of pine and wildflowers, ' +
        'and the ground is soft with moss and fallen leaves. Birds flit between ' +
        'branches, and the occasional snap of a twig hints at unseen creatures ' +
        'nearby. The path feels ancient, as if it remembers every footstep that has ' +
        'ever passed this way.',
      items: [new Vines(), new Bush()],
      characters: [],
      exits: { north: 'Riverbank', south: 'HiddenGlade' },
    })
  }

  /**
   * An adaptive description depending on whether vines remain present.
   * Reserved for future conditional text, as in the Python original.
   */
  getDescription(_gameState: GameState): string {
    if (this.items.some((item) => item instanceof Vines)) {
      return this.description
    }
    return (
      'A winding path snakes into the heart of the woods, dappled sunlight ' +
      'flickering through the canopy above. Where thick vines once blocked a ' +
      'small alcove, they now lie cut, revealing the opening. The air is alive ' +
      'with the scent of pine and wildflowers, and the ground is soft with ' +
      'moss and fallen leaves. Birds flit between branches, and the occasional ' +
      'snap of a twig hints at unseen creatures nearby. The path feels ancient, ' +
      'as if it remembers every footstep that has ever passed this way.'
    )
  }
}
