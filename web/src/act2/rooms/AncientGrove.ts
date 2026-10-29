import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { SilverTree } from '../items/SilverTree'
import { FLAG_WHISPERS_IN_WIND_COMPLETED } from '../Act2StoryFlags'

/** The room's description; `Act2.afterLoad` restores it in older saves. */
export const ANCIENT_GROVE_DESCRIPTION =
  'A ring of trees so old their trunks are wider than a cottage. Signs ' +
  'are carved in their bark, older than any letters you know. In the ' +
  'middle stands one tree taller than the rest, with bark the colour of ' +
  'tarnished silver.'

/**
 * Ancient Grove room: sacred forest waypoint gating deeper heart access by quest flag.
 *
 * `getExits()` hides the `south` exit until FLAG_WHISPERS_IN_WIND_COMPLETED is set.
 */
export class AncientGrove extends Room {
  constructor() {
    super({
      name: 'Ancient Grove',
      description: ANCIENT_GROVE_DESCRIPTION,
      items: [new SilverTree()],
      characters: [],
      exits: { north: 'ForestEntrance', south: 'HeartOfTheForest' },
    })
  }

  /** Return exits, revealing south only after the whispers quest is completed. */
  override getExits(gameState: GameState): Exits {
    const baseExits: Exits = { north: 'ForestEntrance' }
    if (gameState && gameState.getStoryFlag(FLAG_WHISPERS_IN_WIND_COMPLETED)) {
      baseExits.south = 'HeartOfTheForest'
    }
    return baseExits
  }
}
