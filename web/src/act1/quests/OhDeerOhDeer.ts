import { characterName, Quest, type GameState } from '@/engine'
import { FLAG_DEER_CAN_BE_OBSERVED } from '../Act1StoryFlags'

/** Side quest: witness the magical deer the Blacksmith spoke of. */
export class OhDeerOhDeerQuest extends Quest {
  constructor() {
    super({
      name: 'Oh deer, oh deer',
      description:
        `${characterName('Borin')}'s grandfather swore by a ${characterName('deer')} in the Hidden Glade ` +
        'that comes to folk who keep still. Not to hunters. Not to talkers.',
      completion:
        `The ${characterName('deer')} came to you in the glade, ` +
        'and where it stood a rare flower opened.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_DEER_CAN_BE_OBSERVED)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getItem('rare flower') !== null
  }
}
