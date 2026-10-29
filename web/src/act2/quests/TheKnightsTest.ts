import { Quest, type GameState } from '@/engine'
import {
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
} from '../Act2StoryFlags'

/** The journal entry, which is also the quest description. */
const DESCRIPTION =
  'Sir Cedric will not trust you on your word. He wants to see ' +
  'you with a blade, in the courtyard.'

/** The line shown when the quest is done. */
const COMPLETION =
  'You held your own against Sir Cedric in the yard, and he ' +
  'trusts you now.'

/** Quest to prove combat skills to Sir Cedric. */
export class TheKnightsTestQuest extends Quest {
  constructor() {
    super({
      name: "The Knight's Test",
      description: DESCRIPTION,
      completion: COMPLETION,
    })
  }

  /** Bring the log up to date in a save made with the older wording. */
  refreshText(): void {
    this.description = DESCRIPTION
    this.completion = COMPLETION
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC)
  }

  override checkCompletion(gameState: GameState): boolean {
    if (gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
      return true
    }
    return false
  }
}
