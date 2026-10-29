import { Quest, type GameState } from '@/engine'
import {
  QUEST_HERMITS_WARNING,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_HERMITS_WARNING_ACCEPTED,
} from '../Act2StoryFlags'

/** The journal entry, which is also the quest description. */
const DESCRIPTION =
  "A hermit at the forest's edge says the forest moves its paths and keeps " +
  "old things that don't care for strangers. The hermit gave you a charm " +
  'with their mark on it, and told you not to walk in tonight: make camp ' +
  'by the stones first, so the forest can get a look at you.'

/** The line shown when the quest is done. */
const COMPLETION =
  "You spent a night on the forest's doorstep, and she let you. " +
  'The way east is open.'

/** Quest to heed the hermit's warning and prepare for the Enchanted Forest. */
export class TheHermitsWarningQuest extends Quest {
  constructor() {
    super({
      name: QUEST_HERMITS_WARNING,
      description: DESCRIPTION,
      completion: COMPLETION,
    })
  }

  /** Bring the log up to date in a save made with the older wording. */
  refreshText(): void {
    this.description = DESCRIPTION
    this.completion = COMPLETION
  }

  /** Check if the quest should be activated when the hermit's warning is accepted. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_HERMITS_WARNING_ACCEPTED)
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_HERMITS_WARNING_COMPLETED
  }
}
