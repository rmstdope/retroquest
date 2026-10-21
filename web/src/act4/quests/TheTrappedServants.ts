import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
  FLAG_ACT4_TRAPPED_SERVANTS_STARTED,
} from '../Act4StoryFlags'

/** Side quest: win the trust of the enchanted servants and break their chains. */
export class TheTrappedServants extends Quest {
  constructor() {
    super({
      name: 'The Trapped Servants',
      description:
        "Malakar's servants wander the courtyard in chains of shadow, bound to " +
        'serve him against their will. Win their trust, and break the chains.',
      completion:
        "Elior's courage earns the servants' trust, and a blessing breaks " +
        'their chains. Freed, they offer what help they can for the trials ahead.',
    })
  }

  /** Start on first entering the Outer Courtyard. */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED)
    )
  }

  /** Complete when the servants are freed. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED)
  }
}
