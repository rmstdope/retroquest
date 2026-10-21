import { Room } from '@/engine'
import { MasterHealerLyria } from '../characters/MasterHealerLyria'

/**
 * Healer's House room: restorative enclave where Master Healer Lyria lives.
 */
export class HealersHouse extends Room {
  constructor() {
    super({
      name: "Healer's House",
      description:
        'A cozy cottage filled with the scents of medicinal herbs and healing potions. ' +
        'Dried plants hang from the rafters and shelves are packed with bottles of many ' +
        'shapes and colors. A warm fire crackles in the hearth while comfortable chairs ' +
        'invite recovery. This is clearly a place of healing and learning.',
      items: [],
      characters: [new MasterHealerLyria()],
      exits: { south: 'ResidentialQuarter' },
    })
  }
}
