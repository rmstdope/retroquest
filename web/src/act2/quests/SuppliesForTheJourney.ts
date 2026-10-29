import { Quest, type GameState } from '@/engine'
import {
  QUEST_SUPPLIES_FOR_THE_JOURNEY,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SUPPLIES_QUEST_COMPLETED,
} from '../Act2StoryFlags'
import { ForestSurvivalKit } from '../items/ForestSurvivalKit'
import { EnhancedLantern } from '../items/EnhancedLantern'
import { QualityRope } from '../items/QualityRope'

/** The journal entry, which is also the quest description. */
const DESCRIPTION =
  'Sir Cedric gave you coin for the forest: a survival kit, an ' +
  'enhanced lantern and rope, from the Market District.'

/** The line shown when the quest is done. */
const COMPLETION = 'The kit, the lantern and the rope are in your pack.'

/** Quest to gather essential gear for the forest expedition. */
export class SuppliesForTheJourneyQuest extends Quest {
  constructor() {
    super({
      name: QUEST_SUPPLIES_FOR_THE_JOURNEY,
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
