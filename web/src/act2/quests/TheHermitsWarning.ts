import { Quest, type GameState } from '@/engine'
import {
  QUEST_HERMITS_WARNING,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_HERMITS_WARNING_ACCEPTED,
} from '../Act2StoryFlags'

/** Quest to heed the hermit's warning and prepare for the Enchanted Forest. */
export class TheHermitsWarningQuest extends Quest {
  constructor() {
    super({
      name: QUEST_HERMITS_WARNING,
      description:
        'A forest hermit at the edge of the Enchanted Forest has warned you ' +
        "that the forest moves its paths and keeps old things that don't " +
        'care for strangers. The hermit has given ' +
        'you a protective charm to help safeguard your journey through the ' +
        'magical wilderness, but you need to prepare yourself before venturing ' +
        'further into the Enchanted Forest.',
      completion:
        "You spent a night on the forest's doorstep, and she let you. " +
        'The way east is open.',
    })
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
