import { characterName, Quest, type GameState } from '@/engine'
import { Candle } from '../items/Candle'
import { FLAG_PRIEST_TALKED_TO } from '../Act1StoryFlags'

/** Side quest: bring light to the chapel for the priest. */
export class LetThereBeLightQuest extends Quest {
  constructor() {
    super({
      name: 'Let there be light',
      description:
        `The ${characterName('priest')} is out of matches and his candle is cold. ` +
        `${characterName('Hemlock')} at the General Store keeps a box for him.`,
      completion:
        'The candle is lit, and in the dark corner by the altar its light found a locket.',
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
