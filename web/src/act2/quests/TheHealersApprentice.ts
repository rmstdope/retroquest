import { Quest, type GameState } from '@/engine'
import {
  FLAG_HEALERS_APPRENTICE_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
} from '../Act2StoryFlags'

/** Quest to become Master Healer Lyria's apprentice: herbs first, then the Crystal Focus. */
export class TheHealersApprenticeQuest extends Quest {
  constructor() {
    super({
      name: "The Healer's Apprentice",
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

  /** Completes once Lyria has been given the Crystal Focus and taught greater heal. */
  override checkCompletion(gameState: GameState): boolean {
    // Quest completes when player has been taught greater heal over the carter's bed (focus given)
    return gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)
  }
}
