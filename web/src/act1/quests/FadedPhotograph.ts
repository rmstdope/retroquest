import { characterName, Quest, type GameState } from '@/engine'
import {
  FLAG_FOUND_PHOTO,
  FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO,
} from '../Act1StoryFlags'

/**
 * The Faded Photograph quest: find the photograph in Elior's cottage, read the
 * cryptic message on its back and talk to Grandmother about it.
 */
export class FadedPhotographQuest extends Quest {
  constructor() {
    super({
      name: 'The Faded Photograph',
      description:
        'Somewhere in the cottage lies an old photograph of your parents, tucked away in a drawer. ' +
        `Read the cryptic message on its back, then show it to your ${characterName('grandmother')} ` +
        'and ask her what she remembers.',
      completion:
        `You have found the photograph, read its cryptic message and shown it to your ${characterName('grandmother')}, ` +
        "deepening the mystery of your parents' fate.",
    })
  }

  /** Triggered when the player finds the photograph. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_FOUND_PHOTO)
  }

  /** Completed when the player finishes the dialogue with Grandmother about the photograph. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO)
  }
}
