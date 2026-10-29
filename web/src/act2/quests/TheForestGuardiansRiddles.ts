import { Quest, type GameState } from '@/engine'
import {
  QUEST_FOREST_GUARDIANS_RIDDLES,
  FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED,
  FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED,
} from '../Act2StoryFlags'

/** The journal entry, which is also the quest description. */
const DESCRIPTION =
  'The forest sprites say the water nymphs, east of the Forest Entrance, ' +
  'have riddles for travellers who want the deep paths.'

/** The line shown when the quest is done. */
const COMPLETION =
  "You answered the nymphs' three riddles: water, mask and truth. " +
  'They gave you water from their stream and moonflowers from its bank.'

/**
 * Quest to solve the riddles posed by the forest guardians. Riddle interactions
 * elsewhere set the completion flag; `complete` prints the formatted completion
 * line on first completion.
 */
export class TheForestGuardiansRiddles extends Quest {
  experienceReward = 200

  constructor() {
    super({
      name: QUEST_FOREST_GUARDIANS_RIDDLES,
      description: DESCRIPTION,
      completion: COMPLETION,
    })
  }

  /** Bring the description up to date in a save made with the older directions. */
  refreshText(): void {
    this.description = DESCRIPTION
    this.completion = COMPLETION
  }

  /** Check if this quest should be activated. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED)
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED
  }
}
