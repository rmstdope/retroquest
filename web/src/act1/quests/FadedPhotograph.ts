import { Quest, type GameState } from '@/engine'
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
        'Your grandmother is often seen gazing at an old photograph. If you ask her about it, she shares a memory of your parents and gives you the photo, which has a cryptic message on the back.',
      completion:
        "You have received the photograph and discovered a cryptic message, deepening the mystery of your parents' fate.",
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
