import { Quest, type GameState } from '@/engine'
import { FLAG_DEER_CAN_BE_OBSERVED } from '../Act1StoryFlags'

/** Side quest: witness the magical deer the Blacksmith spoke of. */
export class OhDeerOhDeerQuest extends Quest {
  constructor() {
    super({
      name: 'Oh deer, oh deer',
      description:
        'You have heard tales of a magical deer from the Blacksmith. Perhaps you will witness something extraordinary yourself!',
      completion:
        'You have observed the magical deer, gaining a deeper understanding of the wonders and mysteries of Eldoria.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_DEER_CAN_BE_OBSERVED)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getItem('rare flower') !== null
  }
}
