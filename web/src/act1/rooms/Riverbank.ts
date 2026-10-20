import { characterName, Room } from '@/engine'
import { SmoothStone } from '../items/SmoothStone'
import { River } from '../items/River'
import { Fisherman } from '../characters/Fisherman'

/** Riverbank room: tranquil edge location introducing fishing ambience. */
export class Riverbank extends Room {
  constructor() {
    super({
      name: 'Riverbank',
      description:
        'A gentle river flows past the village. Reeds sway along the banks, and ' +
        `the air is alive with the hum of insects. A weathered ${characterName('fisherman')} sits ` +
        'nearby, humming a quiet tune. The riverbank is peaceful, a place where ' +
        'time seems to slow and worries drift away.',
      items: [new SmoothStone(), new River()],
      characters: [new Fisherman()],
      exits: { west: 'OldMill', south: 'ForestPath' },
    })
  }
}
