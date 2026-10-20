import { Quest, type GameState } from '@/engine'
import {
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
      name: 'Supplies for the Journey',
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

  override checkCompletion(gameState: GameState): boolean {
    if (!this.completed) {
      const hasSurvivalKit = gameState.inventory.some(
        (item) => item instanceof ForestSurvivalKit,
      )
      const hasLantern = gameState.inventory.some(
        (item) => item instanceof EnhancedLantern,
      )
      const hasRope = gameState.inventory.some(
        (item) => item instanceof QualityRope,
      )
      if (hasSurvivalKit && hasLantern && hasRope) {
        this.completed = true
        gameState.setStoryFlag(FLAG_SUPPLIES_QUEST_COMPLETED, true)
        return true
      }
    }
    return false
  }
}
