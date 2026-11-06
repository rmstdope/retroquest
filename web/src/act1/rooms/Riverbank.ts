import { characterName, Room, type GameState } from '@/engine'
import { SmoothStone } from '../items/SmoothStone'
import { River } from '../items/River'
import { Scenery } from '../items/Scenery'
import { Fisherman } from '../characters/Fisherman'

/**
 * Riverbank room: the bend of the river named on the back of the faded
 * photograph, where the fisherman keeps watch.
 *
 * Once the fisherman has told of the tin, a search finds it under the smooth
 * stone (SmoothStone.uncoverTin), as lifting the stone or digging at it does.
 */
export class Riverbank extends Room {
  constructor() {
    super({
      name: 'Riverbank',
      description:
        'A gentle river flows past the village and makes a slow bend here, ' +
        "past the reeds and a broad, flat stone at the water's edge. " +
        'Insects hum over the water. ' +
        `A weathered ${characterName('fisherman')} sits on an upturned crate ` +
        'at the bend, watching the water.',
      items: [new SmoothStone(), new River(), ...Scenery.forRoom('Riverbank')],
      characters: [new Fisherman()],
      exits: { west: 'OldMill', south: 'ForestPath' },
    })
  }

  /** Finds the mother's tin under the smooth stone once the fisherman has told of it. */
  override search(gameState: GameState): string {
    const stone = this.items.find((item) => item instanceof SmoothStone)
    const found = stone ? stone.uncoverTin(gameState) : ''
    if (found) return found
    return (
      'You search along the bank, among the reeds and the mud, but find ' +
      'nothing of interest.'
    )
  }
}
