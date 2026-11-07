import { Quest, characterName, type GameState } from '@/engine'
import {
  QUEST_LOST_CARAVAN,
  FLAG_SPOKEN_TO_CARAVAN_MASTER,
  FLAG_FOUND_LOST_CARAVAN,
  FLAG_LOST_CARAVAN_COMPLETED,
} from '../Act2StoryFlags'

/** The opening entry: Thorne's caravan is missing. */
const OPENING =
  "Caravan Master Thorne's valuable caravan has gone missing in the Enchanted " +
  'Forest. Find out what happened to the merchants and their goods.'

/** The entry once the merchants are up out of the ravine. */
const RESCUED =
  "You got Thorne's people up out of the ravine on your rope. " +
  characterName('Thorne') +
  ' is still in the Market District, waiting for word of them.'

/** The line shown when the quest is done. */
const COMPLETION =
  "You found Thorne's caravan at the bottom of a ravine and " +
  'brought his people out on a rope. In thanks he gave you papers ' +
  "sent from Heavensforth, meant for a knight's hands."

/**
 * Quest to find and rescue the lost caravan in the Enchanted Forest. Its log
 * moves on once the merchants are rescued, back to Thorne in the market.
 */
export class TheMerchantsLostCaravanQuest extends Quest {
  constructor() {
    super({
      name: QUEST_LOST_CARAVAN,
      description: OPENING,
      completion: COMPLETION,
    })
  }

  /** Bring the log up to date in a save made with the older wording. */
  override refreshSavedText(): void {
    this.completion = COMPLETION
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER)
  }

  /** Once the merchants are rescued, the log moves on to the rescue, once. */
  override checkUpdate(gameState: GameState): boolean {
    if (!gameState.getStoryFlag(FLAG_FOUND_LOST_CARAVAN) || this.latestStage) {
      return false
    }
    this.setJournal([OPENING], RESCUED)
    return true
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_LOST_CARAVAN_COMPLETED
  }
}
