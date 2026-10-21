import { Quest, type GameState } from '@/engine'
import { FLAG_ACT4_MAIN_STARTED } from '../Act4StoryFlags'

/**
 * The main quest of Act IV: break into Malakar's fortress and face him. It
 * starts when the act opens; the pieces that complete it arrive with the later
 * parts of the act.
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

  /** This is the main quest of Act IV. */
  override isMain(): boolean {
    return true
  }
}
