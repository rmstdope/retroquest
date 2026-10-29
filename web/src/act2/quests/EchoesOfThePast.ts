import { Quest, type GameState } from '@/engine'
import {
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_READ_TRAVELERS_JOURNAL,
} from '../Act2StoryFlags'

/** The journal entry, which is also the quest description. */
const DESCRIPTION =
  "Someone copied Willowbrook's birth rolls into a notebook and " +
  'hid it under the floor of the Silver Stag. The historians in ' +
  'the Great Hall keep those rolls.'

/** Quest to research your family heritage and Willowbrook's history. */
export class EchoesOfThePastQuest extends Quest {
  constructor() {
    super({
      name: 'Echoes of the Past',
      description: DESCRIPTION,
      completion:
        'The archive names the Wardens of the Dawn, and a stranger asking ' +
        "after the Willowbrook bloodline on Malakar's business.",
    })
  }

  /** Bring the log up to date in a save made with the older wording. */
  refreshText(): void {
    this.description = DESCRIPTION
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_READ_TRAVELERS_JOURNAL)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE)
  }
}
