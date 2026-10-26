import { Quest, type GameState } from '@/engine'
import {
  QUEST_SUPPLIES_FOR_THE_JOURNEY,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SUPPLIES_QUEST_COMPLETED,
} from '../Act2StoryFlags'
import { ForestSurvivalKit } from '../items/ForestSurvivalKit'
import { EnhancedLantern } from '../items/EnhancedLantern'
import { QualityRope } from '../items/QualityRope'

/** Quest to gather essential gear for the forest expedition. */
export class SuppliesForTheJourneyQuest extends Quest {
  constructor() {
    super({
      name: QUEST_SUPPLIES_FOR_THE_JOURNEY,
      description:
        'Sir Cedric mentioned the need for proper equipment for forest ' +
        'expeditions. Gather essential supplies from the Market District.',
      completion:
        'You have gathered all the essential supplies for forest exploration. ' +
        'The journey supplies quest is complete!',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)
  }

  /** Complete once told to, or once the survival kit, lantern and rope are all carried. */
  override checkCompletion(gameState: GameState): boolean {
    const carries = (kind: new (...args: never[]) => unknown): boolean =>
      gameState.inventory.some((item) => item instanceof kind)
    return (
      this.completed ||
      (carries(ForestSurvivalKit) &&
        carries(EnhancedLantern) &&
        carries(QualityRope))
    )
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_SUPPLIES_QUEST_COMPLETED
  }
}
