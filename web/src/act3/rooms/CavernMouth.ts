import { Room } from '@/engine'
import { MineOverseer } from '../characters/MineOverseer'

/** The misty entrance to the ancient cavern system. */
export class CavernMouth extends Room {
  constructor() {
    super({
      name: 'Cavern Mouth',
      description:
        'A broad arch opens into the hill, hung with cold mist. ' +
        'Lantern light dims a step inside it. ' +
        'Old signs are cut into the arch stone, worn too smooth to read.',
      items: [],
      characters: [new MineOverseer()],
      exits: { north: 'ToolCache', east: 'StillnessVestibule' },
    })
  }
}
