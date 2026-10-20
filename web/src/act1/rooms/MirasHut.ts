import { characterName, Room } from '@/engine'
import { HealingHerb } from '../items/HealingHerb'
import { AncientAmulet } from '../items/AncientAmulet'
import { Mira } from '../characters/Mira'

/** Mira's Hut room: early healing and mystical mentor resource node. */
export class MirasHut extends Room {
  constructor() {
    super({
      name: "Mira's Hut",
      description:
        'A fragrant hut filled with drying herbs and mysterious potions. Shelves ' +
        'overflow with bottles, roots, and colorful flowers. The air is thick with ' +
        'the scent of lavender and sage. Sunlight streams through stained glass, ' +
        `painting the walls in shifting hues. ${characterName('Mira')} herself moves gracefully among ` +
        'her concoctions, her eyes bright with knowledge and kindness.',
      items: [new HealingHerb(), new AncientAmulet()],
      characters: [new Mira()],
      exits: { south: 'VillageSquare' },
    })
  }
}
