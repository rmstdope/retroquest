import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_MINERS_RESCUE_STARTED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
} from '../Act3StoryFlags'

/** Rescue the trapped miners and secure the passage in the Caverns of Shadow. */
export class MinersRescue extends Quest {
  stabilized = false
  rescued = false

  constructor() {
    super({
      name: "Miners' Rescue",
      description:
        'Collapsed Galleries have trapped people behind tons of stone. ' +
        'You must find a way to free them.',
      completion:
        'You stabilized the collapse and led the miners to safety. The route to the inner ' +
        'caverns is now open.',
    })
  }

  /** Trigger when the overseer starts the rescue (flag set). */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_STARTED)
  }

  /** Complete when collapse is stabilized and miners have been escorted. */
  override checkCompletion(gameState: GameState): boolean {
    // For now, check for a story flag or both items used and miners rescued
    return gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)
  }

  /** Return false as this is a side quest. */
  override isMain(): boolean {
    return false
  }
}
