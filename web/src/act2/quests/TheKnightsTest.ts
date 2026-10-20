import { Quest, type GameState } from '@/engine'
import {
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
} from '../Act2StoryFlags'

/** Quest to prove combat skills to Sir Cedric. */
export class TheKnightsTestQuest extends Quest {
  constructor() {
    super({
      name: "The Knight's Test",
      description:
        'Sir Cedric wants to see proof of your combat abilities before ' +
        'trusting you with important responsibilities. Demonstrate your ' +
        'martial skills with a training sword.',
      completion:
        'You have successfully demonstrated your combat skills to Sir ' +
        'Cedric. He now trusts your abilities!',
    })
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
