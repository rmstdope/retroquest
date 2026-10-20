import { Room } from '@/engine'
import { Egg } from '../items/Egg'
import { Feather } from '../items/Feather'
import { Chicken } from '../items/Chicken'

/** Chicken Coop room: light agricultural ambience with small resource items. */
export class ChickenCoop extends Room {
  constructor() {
    super({
      name: 'Chicken Coop',
      description:
        'A small wooden coop stands here, its planks patched and weathered. Nervous ' +
        'chickens cluck and flutter, their feathers ruffled as they dart between ' +
        'straw nests. The air is thick with the scent of hay and the occasional ' +
        'squawk. Sunbeams slip through the slats, casting striped shadows on the ' +
        'dirt floor. High on a rafter, out of reach, something glints where no hen ' +
        'could have put it.',
      items: [new Chicken(), new Egg(), new Feather()],
      characters: [],
      exits: { north: 'VegetableField' },
    })
  }
}
