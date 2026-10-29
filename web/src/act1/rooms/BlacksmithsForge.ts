import { characterName, Room } from '@/engine'
import { Horseshoe } from '../items/Horseshoe'
import { Blacksmith } from '../characters/Blacksmith'

/** Blacksmith's Forge room: sensory craftsmanship hub placeholder for forging systems. */
export class BlacksmithsForge extends Room {
  constructor() {
    super({
      name: "Blacksmith's Forge",
      description:
        'A hot, smoky forge. Coals glow in the hearth and the anvil rings. ' +
        'Hinges, ploughshares and horseshoes hang from the walls, waiting to ' +
        'be mended or fetched, and ' +
        `the ${characterName('blacksmith')} wipes his brow without putting down the hammer.`,
      items: [new Horseshoe()],
      characters: [new Blacksmith()],
      exits: { west: 'VillageWell', north: 'GeneralStore' },
    })
  }
}
