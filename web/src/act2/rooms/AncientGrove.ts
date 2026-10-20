import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { SilverTree } from '../items/SilverTree'
import { FLAG_WHISPERS_IN_WIND_COMPLETED } from '../Act2StoryFlags'

/**
 * Ancient Grove room: sacred forest waypoint gating deeper heart access by quest flag.
 *
 * `getExits()` hides the `south` exit until FLAG_WHISPERS_IN_WIND_COMPLETED is set.
 */
export class AncientGrove extends Room {
  constructor() {
    super({
      name: 'Ancient Grove',
      description:
        'A circular clearing dominated by trees so old and massive they seem to touch ' +
        'the sky. Their bark bears carved symbols that predate human memory, and the ' +
        'air shimmers with concentrated magic. ' +
        'At the center grows a tree unlike any other - its silver bark gleams ' +
        'and its leaves whisper secrets in an ancient tongue. This is clearly a place ' +
        "of power and the sacred gateway to the forest's deepest mysteries.",
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
