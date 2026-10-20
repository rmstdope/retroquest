import { Quest, type GameState } from '@/engine'
import {
  FLAG_SPOKEN_TO_CARAVAN_MASTER,
  FLAG_FOUND_LOST_CARAVAN,
  FLAG_LOST_CARAVAN_COMPLETED,
} from '../Act2StoryFlags'

/** Quest to find and rescue the lost caravan in the Enchanted Forest. */
export class TheMerchantsLostCaravanQuest extends Quest {
  constructor() {
    super({
      name: "The Merchant's Lost Caravan",
      description:
        "Caravan Master Thorne's valuable caravan has gone missing in the Enchanted " +
        'Forest. Find out what happened to the merchants and their goods.',
      completion:
        'You successfully located the missing caravan trapped in a deep ravine ' +
        'within the Enchanted Forest. Using forest speech magic to communicate ' +
        'with woodland creatures, you discovered their location, then employed ' +
        'quality rope to rappel down and rescue the trapped merchants. All ' +
        'merchants survived the ordeal, and Caravan Master Thorne rewarded you ' +
        "with secret documents containing evidence that can clear Sir Cedric's " +
        'name of false accusations from a past court case.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_LOST_CARAVAN_COMPLETED)
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
      'Search the Enchanted Forest for the missing caravan. Try using forest ' +
      'magic to communicate with woodland creatures for information.'
    )
  }
}
