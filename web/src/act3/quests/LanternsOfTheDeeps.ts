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
        'Find something that will fit the carved brackets and will bear or ' +
        'produce light when placed there. Once the mounts hold a living ' +
        'glow, the hall may answer — the stones could yield secrets folded ' +
        'into their seams.',
      completion:
        'Light fills the mounts and the chamber sighs. Threads of pearly ' +
        'flame trace the carvings and the stone seems to part its lips. ' +
        'A pale corridor unfurls where shadow once lay; it feels older ' +
        'than living memory and leads toward what might be the sanctum, ' +
        'veiled in salt and promise. The room has answered — more of its ' +
        'secrets lie open now.',
    })
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
