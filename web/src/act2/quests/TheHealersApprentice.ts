import { Quest, type GameState } from '@/engine'
import {
  QUEST_HEALERS_APPRENTICE,
  FLAG_HEALERS_APPRENTICE_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
} from '../Act2StoryFlags'

/** Quest to become Master Healer Lyria's apprentice: herbs first, then the Crystal Focus. */
export class TheHealersApprenticeQuest extends Quest {
  constructor() {
    super({
      name: QUEST_HEALERS_APPRENTICE,
      description:
        "Master Healer Lyria let you watch her at a dying carter's bed. Your " +
        'herbs were not enough. She needs a Crystal Focus, and the old ' +
        'scholars of Greendale may have hidden one with their books.',
      completion:
        "Over the carter's bed, with the Crystal Focus between her hands " +
        'and then yours, Lyria taught you greater heal. He will live.',
    })
  }

  /** Triggers when the player gives Lyria the healing herbs. */
  override checkTrigger(gameState: GameState): boolean {
    // Quest triggers when the player gives Lyria the healing herbs.
    return gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_HEALERS_APPRENTICE_COMPLETED
  }
}
