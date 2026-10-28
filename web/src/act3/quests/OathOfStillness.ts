import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_OATH_OF_STILLNESS_STARTED,
} from '../Act3StoryFlags'

/** Quiet the Stillness Vestibule with the old chant before the dragon's hall. */
export class OathOfStillness extends Quest {
  constructor() {
    super({
      name: 'Oath of Stillness',
      description:
        'Grey figures drift among the pools of the Stillness Vestibule, ' +
        'saying the same thing over, as they have for years. The way to the ' +
        "dragon's hall stays shut until the echo stones there are blessed and " +
        'given the old chant. Its words are cut into the walls of the Echo ' +
        'Chambers.',
      completion:
        'The chant ran through the echo stones and out across the still ' +
        'water, and the hush of the Stillness Vestibule closed over it. ' +
        'Nothing there is saying the same thing over any more, and the way ' +
        "to the dragon's hall lies open.",
    })
  }

  /** Trigger when Miners' Rescue is completed and player accesses Echo Chambers. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED)
  }

  /** Complete when the oath has been performed and illusions are silenced. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)
  }

  /** Return false as this is a side quest. */
  override isMain(): boolean {
    return false
  }
}
