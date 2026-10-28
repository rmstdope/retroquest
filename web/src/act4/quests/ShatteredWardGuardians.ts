import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
} from '../Act4StoryFlags'

/** Side quest: break the shadow guardians' hold on the Fortress Gates. */
export class ShatteredWardGuardians extends Quest {
  constructor() {
    super({
      name: 'Shattered Ward Guardians',
      description:
        'Shadow guardians and a wall of violet light bar the way into the ' +
        'fortress. Find what feeds them, and break their hold on the gates.',
      completion:
        "Elior's light breaks the guardians' hold on the gates. The ward " +
        "stones fall dark, and the way into Malakar's fortress lies open.",
    })
  }

  /** Start when the barrier first throws Elior back or the ward stones are examined. */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)
    )
  }

  /** Complete when the guardians are banished. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)
  }
}
