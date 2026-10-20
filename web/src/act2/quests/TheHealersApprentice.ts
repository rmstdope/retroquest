import { Quest, type GameState } from '@/engine'
import {
  FLAG_HEALERS_APPRENTICE_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
} from '../Act2StoryFlags'

/** Quest to become Master Healer Lyria's apprentice and learn greater_heal. */
export class TheHealersApprenticeQuest extends Quest {
  constructor() {
    super({
      name: "The Healer's Apprentice",
      description:
        'Master Healer Lyria has recognized your magical potential and offered ' +
        'to teach you advanced healing techniques. Learn from her wisdom and ' +
        'master the greater_heal spell.',
      completion:
        'You have successfully completed your apprenticeship with Master ' +
        "Healer Lyria! You've learned the greater_heal spell through her " +
        'advanced training. Your understanding of healing magic has grown ' +
        'significantly.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    // Quest triggers when player talks to Lyria with Healing Herbs
    return gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)
  }

  override checkCompletion(gameState: GameState): boolean {
    // Quest completes when player has learned greater_heal spell and received training
    return gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)
  }
}
