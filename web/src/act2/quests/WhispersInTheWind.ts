import { Quest, type GameState } from '@/engine'
import {
  QUEST_WHISPERS_IN_THE_WIND,
  FLAG_WHISPERS_IN_WIND_OFFERED,
  FLAG_WHISPERS_IN_WIND_COMPLETED,
} from '../Act2StoryFlags'

/** The journal entry, which is also the quest description. */
const DESCRIPTION =
  'The spirit in the silver-barked tree taught you forest speech ' +
  'for an acorn. Now its roots want what the nymphs in the ' +
  'Whispering Glade can give.'

/** The line shown when the quest is done. */
const COMPLETION =
  "You brought the tree spirit the nymphs' water and moonflowers, " +
  'and the way south opened toward Nyx.'

/**
 * Quest to commune with water nymphs and earn the Ancient Tree Spirit's trust.
 * Completes when the flag is set externally; `complete` prints the formatted
 * completion line on first completion.
 */
export class WhispersInTheWind extends Quest {
  constructor() {
    super({
      name: QUEST_WHISPERS_IN_THE_WIND,
      description: DESCRIPTION,
      completion: COMPLETION,
    })
  }

  /** Check if this quest should be activated. */

  /** Bring the log up to date in a save made with the older wording. */
  refreshText(): void {
    this.description = DESCRIPTION
    this.completion = COMPLETION
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_WHISPERS_IN_WIND_OFFERED)
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_WHISPERS_IN_WIND_COMPLETED
  }
}
