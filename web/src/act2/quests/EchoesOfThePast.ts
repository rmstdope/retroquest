import { Quest, type GameState } from '@/engine'
import {
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_READ_TRAVELERS_JOURNAL,
} from '../Act2StoryFlags'

/** Quest to research your family heritage and Willowbrook's history. */
export class EchoesOfThePastQuest extends Quest {
  constructor() {
    super({
      name: 'Echoes of the Past',
      description:
        "Investigate your family heritage and Willowbrook's significance by " +
        'researching historical records and genealogical information in the ' +
        'Great Hall.',
      completion:
        'You have uncovered important information about your family heritage ' +
        "and Willowbrook's significance in ancient history!",
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_READ_TRAVELERS_JOURNAL)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE)
  }
}
