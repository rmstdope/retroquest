import { Quest, type GameState } from '@/engine'
import {
  QUEST_INNKEEPERS_DAUGHTER,
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
} from '../Act2StoryFlags'

/** What the log says while Elena is cursed: nobody can say who laid it. */
export const INNKEEPERS_DAUGHTER_DESCRIPTION =
  'Elena, the barmaid at the Silver Stag, wakes a little colder every ' +
  'morning. The healers call it a curse; nobody can say who laid it.'

/** What the log says once the curse is unbound. */
export const INNKEEPERS_DAUGHTER_COMPLETION =
  'You made Elena strong with greater heal, washed the mark in water from ' +
  "the nymphs' spring, and unbound the curse with the Wardens' dispel. The " +
  'silver mask on her wrist faded, and she is warm again.'

/** Quest to save Elena, the innkeeper's daughter, from a curse nobody can trace. */
export class TheInnkeepersDaughterQuest extends Quest {
  constructor() {
    super({
      name: QUEST_INNKEEPERS_DAUGHTER,
      description: INNKEEPERS_DAUGHTER_DESCRIPTION,
      completion: INNKEEPERS_DAUGHTER_COMPLETION,
    })
  }

  /** Bring the log up to date in a save made with the older wording. */
  refreshText(): void {
    this.description = INNKEEPERS_DAUGHTER_DESCRIPTION
    this.completion = INNKEEPERS_DAUGHTER_COMPLETION
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE)
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_INNKEEPERS_DAUGHTER_COMPLETED
  }
}
