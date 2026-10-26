import { Quest, type GameState } from '@/engine'
import {
  QUEST_FOREST_GUARDIANS_RIDDLES,
  FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED,
  FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED,
} from '../Act2StoryFlags'

/** The journal entry, which is also the quest description. */
const DESCRIPTION =
  'The forest sprites have challenged you to prove your wisdom by solving the ' +
  'riddles of the forest guardians. You must journey east from the Forest ' +
  'Entrance to the Whispering Glade, where ancient spirits will test ' +
  'your understanding of forest ways and natural wisdom.'

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
      completion:
        'You have successfully solved the riddles of the forest guardians, ' +
        'proving your wisdom and respect for the natural world. The ' +
        'forest spirits acknowledge your understanding.',
    })
  }

  /** Bring the description up to date in a save made with the older directions. */
  refreshText(): void {
    this.description = DESCRIPTION
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
