import { Quest, type GameState } from '@/engine'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'

/** Side quest: seek guidance to unlock the secrets of Elior's newfound magic. */
export class MagicForRealQuest extends Quest {
  constructor() {
    super({
      name: 'Magic for real',
      description:
        'You discover that you possess mysterious magical abilities. ' +
        'Strange phenomena begin to occur around you, hinting at a power you never knew you had. ' +
        'You must seek guidance and understanding to unlock the secrets of your newfound magic and learn what it means for your destiny.',
      completion:
        'You have embraced your magical abilities and taken your first steps on a path filled with wonder and danger. The world will never be the same for you.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.knownSpells.length > 0
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)
  }
}
