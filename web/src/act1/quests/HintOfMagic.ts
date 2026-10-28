import { characterName, Quest, type GameState } from '@/engine'
import { FLAG_WOKE_FROM_DREAM } from '../Act1StoryFlags'

/** Quest that unlocks the cottage exits after the player learns the revive spell. */
export class HintOfMagicQuest extends Quest {
  constructor() {
    super({
      name: 'Hint of Magic',
      description:
        'You woke with three words written down and a tune still going in the house. ' +
        `${characterName('Grandmother')} is at the hearth, ` +
        'and she will want to hear about the dream.',
      completion:
        `${characterName('Grandmother')} told you of your father's journal, ` +
        'and his word for calling a thing back. ' +
        'It came to you as she spoke, and it stayed.',
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
