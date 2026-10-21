import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
} from '../Act4StoryFlags'

/** Side quest: see through the Sorceress of Lies and answer her loneliness. */
export class TheSorceressOfLies extends Quest {
  constructor() {
    super({
      name: 'The Sorceress of Lies',
      description:
        'At the top of the tower the Sorceress of Lies holds court, and the ' +
        "mask on her staff is the mark that lay beneath Elena's curse. See " +
        'through her lies, and find what lies beneath them.',
      completion:
        "Elior sees through the Sorceress's lies and answers the loneliness " +
        'beneath them. She confesses the curse on Elena, and the arch to the ' +
        'north opens.',
    })
  }

  /** Start on first entering the Chamber of Whispers (or first meeting her). */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)
    )
  }

  /** Complete when the Sorceress is redeemed. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)
  }
}
