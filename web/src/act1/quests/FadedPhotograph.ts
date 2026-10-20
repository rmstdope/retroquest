import { characterName, Quest, type GameState } from '@/engine'
import { FLAG_FOUND_PHOTO, FLAG_READ_MOTHERS_LETTER } from '../Act1StoryFlags'

/**
 * The Faded Photograph quest: find the photograph in Elior's cottage, read the
 * cryptic message on its back, ask Grandmother about it, then follow the
 * message to the river bend, where the fisherman leads Elior to his mother's
 * letter. Reading the letter completes the quest.
 */
export class FadedPhotographQuest extends Quest {
  constructor() {
    super({
      name: 'The Faded Photograph',
      description:
        'Somewhere in the cottage lies an old photograph of your parents, tucked away in a drawer. ' +
        `Read the cryptic message on its back and show it to your ${characterName('grandmother')}. ` +
        'Then seek the truth where the river bends.',
      completion:
        "At the river bend you found your mother's letter, hidden beneath the smooth stone. " +
        'Its words raise more questions than they answer, but they are hers.',
    })
  }

  /** Triggered when the player finds the photograph. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_FOUND_PHOTO)
  }

  /** Completed when the player reads the mother's letter from the river bend. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_READ_MOTHERS_LETTER)
  }
}
