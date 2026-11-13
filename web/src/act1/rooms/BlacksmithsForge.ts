import { characterName, Room, type GameState } from '@/engine'
import { Horseshoe } from '../items/Horseshoe'
import { Blacksmith } from '../characters/Blacksmith'
import { Scenery } from '../items/Scenery'

const FORGE_DESCRIPTION =
  'A hot, smoky forge. Coals glow in the hearth and the anvil rings. ' +
  'Hinges, ploughshares and horseshoes hang from the walls, waiting to ' +
  'be mended or fetched, and ' +
  `${characterName('Borin')} wipes his brow without putting down the hammer.`

/** Blacksmith's Forge room: sensory craftsmanship hub placeholder for forging systems. */
export class BlacksmithsForge extends Room {
  constructor() {
    super({
      name: "Blacksmith's Forge",
      description: FORGE_DESCRIPTION,
      items: [new Horseshoe(), ...Scenery.forRoom('BlacksmithsForge')],
      characters: [new Blacksmith()],
      exits: { west: 'VillageWell', north: 'GeneralStore' },
    })
  }

  /** The forge's look: always the current wording, even for an older save. */
  override descriptionFor(_gameState: GameState): string {
    return FORGE_DESCRIPTION
  }
}
