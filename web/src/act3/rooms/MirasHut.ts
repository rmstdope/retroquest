import { Room } from '@/engine'
import { Mira } from '../characters/Mira'
import { SirCedric } from '../characters/SirCedric'
import { AncientAmulet } from '../items/AncientAmulet'
import { HealingHerbs } from '../items/HealingHerbs'
import { TeleportationFocus } from '../items/TeleportationFocus'

/** A fragrant hut filled with drying herbs and mysterious potions. */
export class MirasHut extends Room {
  constructor() {
    super({
      name: "Mira's Hut",
      description:
        'A fragrant hut filled with drying herbs and mysterious potions. Shelves ' +
        'overflow with bottles, roots, and colorful flowers. The air is thick with ' +
        'the scent of lavender and sage. Sunlight streams through stained glass, ' +
        'painting the walls in shifting hues. Mira herself moves gracefully among ' +
        'her concoctions, her eyes bright with knowledge and kindness.',
      items: [
        new HealingHerbs(),
        new AncientAmulet(),
        new TeleportationFocus(),
      ],
      characters: [new Mira(), new SirCedric()],
      exits: {},
    })
  }
}
