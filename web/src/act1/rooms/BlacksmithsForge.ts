import { characterName, Room, type GameState } from '@/engine'
import { Horseshoe } from '../items/Horseshoe'
import { Blacksmith } from '../characters/Blacksmith'
import { Scenery } from '../items/Scenery'

const FORGE_START =
  'A hot, smoky forge. A log fire burns on the hearthstone, and not all of ' +
  'its smoke finds the chimney.'
const HORSESHOE_ON_WALL = ' A single horseshoe hangs on the wall.'
const FORGE_END =
  ` ${characterName('Borin')} stands between the fire and the anvil, his ` +
  'hammer in his hand, watching the fire.'

/** Blacksmith's Forge room: sensory craftsmanship hub placeholder for forging systems. */
export class BlacksmithsForge extends Room {
  constructor() {
    super({
      name: "Blacksmith's Forge",
      description: FORGE_START + HORSESHOE_ON_WALL + FORGE_END,
      items: [new Horseshoe(), ...Scenery.forRoom('BlacksmithsForge')],
      characters: [new Blacksmith()],
      exits: { west: 'VillageWell', north: 'GeneralStore' },
    })
  }

  /**
   * The forge's look: always the current wording, even for an older save,
   * with the horseshoe on the wall only while it still hangs there.
   */
  override descriptionFor(_gameState: GameState): string {
    const onWall = this.items.some((item) => item instanceof Horseshoe)
    return FORGE_START + (onWall ? HORSESHOE_ON_WALL : '') + FORGE_END
  }
}
