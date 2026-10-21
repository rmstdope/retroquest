import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_FINAL_STAND_COMPLETED,
  FLAG_ACT4_MAIN_STARTED,
} from '../Act4StoryFlags'

/**
 * The main quest of Act IV: break into Malakar's fortress and face him. It
 * starts when the act opens and completes when the Throne Chamber's wound is
 * closed in Redemption, Justice or Sacrifice.
 */
export class TheFinalStand extends Quest {
  constructor() {
    super({
      name: 'The Final Stand',
      description:
        "Malakar's fortress stands before you, and somewhere inside King " +
        'Alden is held captive. Break through its defences and face the sorcerer.',
    })
  }

  /** Start with the act. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_MAIN_STARTED)
  }

  /** Complete when the wound is closed in one of the three endings. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_FINAL_STAND_COMPLETED)
  }

  /** This is the main quest of Act IV. */
  override isMain(): boolean {
    return true
  }
}
