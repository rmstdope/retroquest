import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_PARENTS_LEGACY_STARTED,
} from '../Act4StoryFlags'

/** Side quest: look into Aren and Lysa's last memories. */
export class TheParentsLegacy extends Quest {
  constructor() {
    super({
      name: "The Parent's Legacy",
      description:
        "Behind the sealed door, Aren and Lysa's last memories wait. Look " +
        'into them, and learn the whole truth before the throne room.',
      completion:
        "Elior sees the whole truth: his parents' friendship with Malakar, " +
        'the wound, and the ward they became. The way north to the Throne ' +
        'Chamber opens.',
    })
  }

  /** Start on first entering the Parents' Vault. */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)
    )
  }

  /** Complete when the memories have been seen. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)
  }
}
