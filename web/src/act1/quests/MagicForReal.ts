import { characterName, Quest, type GameState } from '@/engine'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'

/** Side quest: seek guidance to unlock the secrets of Elior's newfound magic. */
export class MagicForRealQuest extends Quest {
  constructor() {
    super({
      name: 'Magic for real',
      description:
        'You know a spell now, but when you reach for it the warmth comes and nothing answers. ' +
        `${characterName('Grandmother')} says ${characterName('Mira')} has a way with herbs, ` +
        'and with other things.',
      completion:
        `The flower opened for you, and ${characterName('Mira')} showed you where the door is. ` +
        'Your spells answer now.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.knownSpells.length > 0
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)
  }
}
