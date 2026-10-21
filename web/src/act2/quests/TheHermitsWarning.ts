import { Quest, type GameState } from '@/engine'
import {
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_HERMITS_WARNING_ACCEPTED,
} from '../Act2StoryFlags'

/** Quest to heed the hermit's warning and prepare for the Enchanted Forest. */
export class TheHermitsWarningQuest extends Quest {
  constructor() {
    super({
      name: "The Hermit's Warning",
      description:
        'A forest hermit at the edge of the Enchanted Forest has warned you ' +
        "that the forest moves its paths and keeps old things that don't " +
        'care for strangers. The hermit has given ' +
        'you a protective charm to help safeguard your journey through the ' +
        'magical wilderness, but you need to prepare yourself before venturing ' +
        'further into the Enchanted Forest.',
      completion:
        "You have heeded the hermit's warning and are now prepared to face " +
        'the challenges of the Enchanted Forest.',
    })
  }

  /** Check if the quest should be activated when the hermit's warning is accepted. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_HERMITS_WARNING_ACCEPTED)
  }

  /** Check if the quest should be completed when the survival kit is used. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)
  }
}
