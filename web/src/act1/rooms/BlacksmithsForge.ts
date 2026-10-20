import { characterName, Room } from '@/engine'
import { Horseshoe } from '../items/Horseshoe'
import { Blacksmith } from '../characters/Blacksmith'

/** Blacksmith's Forge room: sensory craftsmanship hub placeholder for forging systems. */
export class BlacksmithsForge extends Room {
  constructor() {
    super({
      name: "Blacksmith's Forge",
      description:
        'A hot, smoky forge glows with the light of burning coals. The clang of ' +
        'hammer on anvil echoes through the air, mingling with the scent of molten ' +
        'metal and sweat. Tools and half-finished weapons hang from the walls, and ' +
        `the ${characterName('blacksmith')} wipes his brow, his arms corded with muscle. Sparks dance ` +
        'in the gloom, and the heat is almost overwhelming.',
      items: [new Horseshoe()],
      characters: [new Blacksmith()],
      exits: { west: 'VillageWell', north: 'GeneralStore' },
    })
  }
}
