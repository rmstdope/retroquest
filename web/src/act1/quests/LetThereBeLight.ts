import { characterName, Quest, type GameState } from '@/engine'
import { Candle } from '../items/Candle'
import { FLAG_PRIEST_TALKED_TO } from '../Act1StoryFlags'

/** Side quest: bring light to the chapel for the priest. */
export class LetThereBeLightQuest extends Quest {
  constructor() {
    super({
      name: 'Let there be light',
      description: `The ${characterName('priest')} has asked you to help bring light to the chapel. Perhaps this small act will illuminate more than just the room for you.`,
      completion: `You have brought light to the chapel, earning the gratitude of the ${characterName('priest')} and the respect of the villagers.`,
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_PRIEST_TALKED_TO)
  }

  override checkCompletion(gameState: GameState): boolean {
    const candle = gameState.getItem('candle')
    return candle instanceof Candle && candle.isLit
  }
}
