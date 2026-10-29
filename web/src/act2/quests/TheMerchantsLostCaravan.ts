import { Quest, type GameState } from '@/engine'
import {
  QUEST_LOST_CARAVAN,
  FLAG_SPOKEN_TO_CARAVAN_MASTER,
  FLAG_FOUND_LOST_CARAVAN,
  FLAG_LOST_CARAVAN_COMPLETED,
} from '../Act2StoryFlags'

/** The line shown when the quest is done. */
const COMPLETION =
  "You found Thorne's caravan at the bottom of a ravine and " +
  'brought his people out on a rope. In thanks he gave you papers ' +
  "sent from Heavensforth, meant for a knight's hands."

/** Quest to find and rescue the lost caravan in the Enchanted Forest. */
export class TheMerchantsLostCaravanQuest extends Quest {
  constructor() {
    super({
      name: QUEST_LOST_CARAVAN,
      description:
        "Caravan Master Thorne's valuable caravan has gone missing in the Enchanted " +
        'Forest. Find out what happened to the merchants and their goods.',
      completion: COMPLETION,
    })
  }

  /** Bring the log up to date in a save made with the older wording. */
  refreshText(): void {
    this.completion = COMPLETION
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER)
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_LOST_CARAVAN_COMPLETED
  }

  /** Provide dynamic quest hints based on current progress. */
  update(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_FOUND_LOST_CARAVAN)) {
      return (
        "You've learned the caravan's location from the woodland creatures. " +
        'Now use rope to reach the ravine and rescue the trapped merchants.'
      )
    }
    return (
      'Search the Enchanted Forest for the missing caravan. Try sensing the land, or ' +
      "speaking with the woodland creatures, at the forest's edge."
    )
  }
}
