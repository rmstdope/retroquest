import { Quest, type GameState } from '@/engine'
import { FLAG_WOKE_FROM_DREAM } from '../Act1StoryFlags'

/** Quest that unlocks the cottage exits after the player learns the revive spell. */
export class HintOfMagicQuest extends Quest {
  constructor() {
    super({
      name: 'Hint of Magic',
      description:
        'After a strange, vivid dream, you awaken with the sense that something beyond ' +
        'the ordinary is calling to you. A mysterious force stirs within, urging you to ' +
        'pay attention to the signs around you and discover what this new feeling means.',
      completion:
        'You have discovered that the strange feeling within you is the first sign of ' +
        'something magical. Your journey into the unknown has truly begun.',
    })
  }

  /** Given when Elior wakes from the dream in his cottage. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_WOKE_FROM_DREAM)
  }

  /**
   * Completed when the player has learned the 'revive' spell. Exits in
   * EliorsCottage are unlocked dynamically via getExits() once the spell is known.
   */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.hasSpell('revive')
  }
}
