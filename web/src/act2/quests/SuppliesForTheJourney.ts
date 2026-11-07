import { Quest, type GameState } from '@/engine'
import {
  QUEST_SUPPLIES_FOR_THE_JOURNEY,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SUPPLIES_QUEST_COMPLETED,
  FLAG_CEDRIC_PAID_FOR_SUPPLIES,
} from '../Act2StoryFlags'
import { ForestSurvivalKit } from '../items/ForestSurvivalKit'
import { EnhancedLantern } from '../items/EnhancedLantern'
import { QualityRope } from '../items/QualityRope'

/** The opening journal entry, which is also the quest description. */
const DESCRIPTION =
  'Sir Cedric wants you to buy a survival kit, an enhanced lantern and ' +
  'rope in the Market District for the forest. He asked you to see him ' +
  'before you go, so you are not sent with empty pockets.'

/** The entry added once Sir Cedric has handed over the coins. */
const PAID =
  'Sir Cedric gave you a hundred and fifty coins for the survival kit, the ' +
  'lantern and the rope. The Market District sells all three.'

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

  /**
   * Bring the log up to date in a save made with the older wording: the
   * opening entry, and the coins entry if Cedric has already paid.
   */
  override refreshSavedText(gameState: GameState): void {
    this.description = DESCRIPTION
    this.earlierStages = undefined
    this.latestStage = undefined
    this.completion = COMPLETION
    this.checkUpdate(gameState)
  }

  /** Add the coins entry the first time Cedric is seen to have paid. */
  override checkUpdate(gameState: GameState): boolean {
    if (this.latestStage === PAID) return false
    if (!gameState.getStoryFlag(FLAG_CEDRIC_PAID_FOR_SUPPLIES)) return false
    this.setJournal([DESCRIPTION], PAID)
    return true
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
