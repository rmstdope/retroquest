import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import {
  FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE,
  FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE,
} from '../Act2StoryFlags'
import { EnchantedAcorn } from '../items/EnchantedAcorn'
import { ForestSprites } from '../characters/ForestSprites'

/**
 * Forest Entrance room: dual-item gated threshold to the enchanted interior.
 *
 * `getExits()` shows `south` and `east` only when both the lantern and charm
 * usage flags are set.
 */
export class ForestEntrance extends Room {
  constructor() {
    super({
      name: 'Forest Entrance',
      description:
        'Massive trees create a natural cathedral as you enter the Enchanted Forest. ' +
        'Dappled sunlight filters through the dense canopy, and the path ahead ' +
        'disappears into green shadows. The air is alive with birds and rustling leaves, ' +
        'but beneath it lies an expectant silence, as if the forest itself is watching. ' +
        'Two paths diverge deeper: one toward an ancient grove—the sacred gateway to the ' +
        "forest's heart—and one toward a tranquil glade. Small motes of light dance " +
        'between the trees: forest sprites watching your every move.',
      items: [new EnchantedAcorn()],
      characters: [new ForestSprites()],
      exits: {
        west: 'ForestTransition',
        south: 'AncientGrove',
        east: 'WhisperingGlade',
      },
    })
  }

  /** Return exits, revealing south/east only after both preparation flags are set. */
  override getExits(gameState: GameState): Exits {
    const exits: Exits = { west: 'ForestTransition' } // Always allow going back west
    // Only show south and east exits if both items have been used
    const lanternUsed = gameState.getStoryFlag(
      FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE,
    )
    const charmUsed = gameState.getStoryFlag(
      FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE,
    )
    if (lanternUsed && charmUsed) {
      exits.south = 'AncientGrove'
      exits.east = 'WhisperingGlade'
    }
    return exits
  }
}
