import { Quest, type GameState } from '@/engine'
import {
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
} from '../Act2StoryFlags'

/** Quest to save Elena, the innkeeper's daughter, from a dark curse. */
export class TheInnkeepersDaughterQuest extends Quest {
  constructor() {
    super({
      name: "The Innkeeper's Daughter",
      description:
        'Elena, the barmaid at The Silver Stag Inn, has been cursed by a ' +
        'dark wizard. Use your magical abilities to break the curse and save ' +
        'her life.',
      completion:
        "Through careful magical healing, you successfully broke Elena's " +
        'curse. You first strengthened her with a greater heal spell, then ' +
        'purified her spirit with crystal-clear water, and finally used a ' +
        'dispel spell to shatter the dark magic completely. Elena is now ' +
        "free from the wizard's curse!",
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)
  }
}
