import { Quest, type GameState } from '@/engine'
import {
  QUEST_ANCIENT_LIBRARY,
  FLAG_ANCIENT_LIBRARY_ACCEPTED,
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
} from '../Act2StoryFlags'

/** The journal entry, which is also the quest description. */
const DESCRIPTION =
  'Behind a bricked-up cellar door in the Residential Quarter, ' +
  'steps lead down to a library nobody in Greendale talks about.'

/** The line shown when the quest is done. */
const COMPLETION =
  "The library's keeper was a Warden once. Its chronicle taught " +
  'you dispel, and its last page warns that Malakar seeks the ' +
  'blood of Willowbrook.'

/**
 * Quest to discover and explore the hidden ancient library beneath Greendale.
 * Completes when Dispel is known and the Crystal Focus is carried or given to Lyria.
 */
export class TheAncientLibraryQuest extends Quest {
  constructor() {
    super({
      name: QUEST_ANCIENT_LIBRARY,
      description: DESCRIPTION,
      completion: COMPLETION,
    })
  }

  /** Bring the log up to date in a save made with the older wording. */
  refreshText(): void {
    this.description = DESCRIPTION
    this.completion = COMPLETION
  }

  override checkTrigger(gameState: GameState): boolean {
    // Quest triggers when player discovers the secret passage
    return gameState.getStoryFlag(FLAG_ANCIENT_LIBRARY_ACCEPTED)
  }

  /**
   * Completes once dispel is known and the Crystal Focus is carried or given
   * to Lyria. On completion it raises FLAG_ANCIENT_LIBRARY_COMPLETED, which
   * adds the library stage to The Gathering Storm journal.
   */
  override checkCompletion(gameState: GameState): boolean {
    // Quest completes when player has:
    // 1. Learned the dispel spell
    // 2. Gained the Crystal Focus: in the pack, or already given to Lyria (FLAG_HEALERS_APPRENTICE_COMPLETED)
    const crystalFocusAcquired =
      gameState.hasItem('Crystal Focus') ||
      gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)
    return gameState.hasSpell('dispel') && crystalFocusAcquired
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_ANCIENT_LIBRARY_COMPLETED
  }
}
