import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_LANTERN_BRACKETS_FOUND,
} from '../Act3StoryFlags'

/**
 * Side quest: retrieve and mount three prism lanterns, then light them.
 *
 * The quest becomes available once the Tideward sigils are completed and
 * the player has discovered the carved lantern brackets in the antechamber.
 */
export class LanternsOfTheDeepsQuest extends Quest {
  constructor() {
    super({
      name: 'Lanterns of the Deeps',
      description:
        'Three carved brackets line the flooded antechamber, cut to hold a lantern. ' +
        'With a light burning in each, the hall might show the way through.',
      completion:
        'The prism lanterns burn in their brackets, and their light lays a ' +
        'clear path through the flooded hall to the sanctum.',
    })
  }

  /** Give an offered or finished quest from an older save the current log. */
  override refreshSavedText(gameState: GameState): void {
    if (gameState.nonActivatedQuests.includes(this)) return
    const fresh = new LanternsOfTheDeepsQuest()
    this.description = fresh.description
    this.completion = fresh.completion
  }

  /**
   * Trigger only after sigils complete and lantern brackets were found.
   *
   * Triggering is limited to the collapsed pier and the submerged antechamber.
   */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_LANTERN_BRACKETS_FOUND)
  }

  /** Check if quest is completed based on lanterns being lit. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)
  }
}
