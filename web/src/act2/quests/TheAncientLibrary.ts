import { Quest, type GameState } from '@/engine'
import {
  FLAG_ANCIENT_LIBRARY_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
} from '../Act2StoryFlags'

/**
 * Quest to discover and explore the hidden ancient library beneath Greendale.
 * Completes when Dispel is known and the Crystal Focus is carried or given to Lyria.
 */
export class TheAncientLibraryQuest extends Quest {
  constructor() {
    super({
      name: 'The Ancient Library',
      description:
        "You've discovered a hidden passage beneath Greendale containing an " +
        'ancient library of magical texts and lore. You should explore its ' +
        'depths and uncover the secrets within.',
      completion:
        "You have successfully gained access to the ancient library's " +
        "knowledge! You've learned the dispel spell, discovered important " +
        'information about your family heritage, and received a Crystal ' +
        'Focus to enhance your magical abilities. The chronicle you read ' +
        "there was the Wardens' own book, and its last page warns that " +
        'Malakar seeks the blood of Willowbrook.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    // Quest triggers when player discovers the secret passage
    return gameState.getStoryFlag(FLAG_ANCIENT_LIBRARY_ACCEPTED)
  }

  override checkCompletion(gameState: GameState): boolean {
    // Quest completes when player has:
    // 1. Learned the dispel spell
    // 2. Gained the Crystal Focus, even if it was already given to Lyria
    const crystalFocusAcquired =
      gameState.hasItem('Crystal Focus') ||
      gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)
    return gameState.hasSpell('dispel') && crystalFocusAcquired
  }
}
