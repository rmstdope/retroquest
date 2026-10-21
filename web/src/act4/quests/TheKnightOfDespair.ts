import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
} from '../Act4StoryFlags'

/** Side quest: see the Knight of Despair as he truly is, and redeem him. */
export class TheKnightOfDespair extends Quest {
  constructor() {
    super({
      name: 'The Knight of Despair',
      description:
        'A knight in a grey cloak bars the stair to the Tower of Shadows, ' +
        'lost in a despair no blade can reach. Learn the truth of him, and ' +
        'find a way past.',
      completion:
        'Elior sees the knight as he truly is and offers him redemption ' +
        'instead of a blade. The man who framed Sir Cedric confesses, and ' +
        'the stair to the Tower of Shadows lies open.',
    })
  }

  /** Start on first entering the Hall of Echoes (or first meeting the knight). */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)
    )
  }

  /** Complete when the knight is redeemed. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)
  }
}
