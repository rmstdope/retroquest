import { Quest, type GameState } from '@/engine'
import {
  QUEST_WHISPERS_IN_THE_WIND,
  FLAG_WHISPERS_IN_WIND_OFFERED,
  FLAG_WHISPERS_IN_WIND_COMPLETED,
} from '../Act2StoryFlags'

/**
 * Quest to commune with water nymphs and earn the Ancient Tree Spirit's trust.
 * Completes when the flag is set externally; `complete` prints the formatted
 * completion line on first completion.
 */
export class WhispersInTheWind extends Quest {
  constructor() {
    super({
      name: QUEST_WHISPERS_IN_THE_WIND,
      description:
        'The Ancient Tree Spirit has sensed mystical beings hidden within the ' +
        "forest's depths. Gentle whispers carry on the wind, speaking of " +
        'ancient wisdom and forgotten lore. To prove yourself worthy of the ' +
        "forest's trust, you must seek out these hidden spirits in the " +
        "Whispering Glade and demonstrate your understanding of nature's " +
        'mysteries.',
      completion:
        'You have communed with the Water Nymphs in the Whispering Glade, ' +
        'solved their ancient riddles, and earned their sacred gifts. By ' +
        'returning these blessed items to the Ancient Tree Spirit, you have ' +
        'proven yourself a true friend to the woodland spirits and earned ' +
        "the forest's trust.",
    })
  }

  /** Check if this quest should be activated. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_WHISPERS_IN_WIND_OFFERED)
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_WHISPERS_IN_WIND_COMPLETED
  }
}
