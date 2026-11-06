import { characterName, Quest, type GameState } from '@/engine'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_MAGIC_FULLY_UNLOCKED,
} from '../Act1StoryFlags'

/** The opening, before Mira has asked for anything. */
const NOTHING_ANSWERS =
  'You know a spell now, but when you reach for it the warmth comes and nothing answers. ' +
  `${characterName('Grandmother')} says ${characterName('Mira')} has a way with herbs, ` +
  'and with other things.'

/** The log once Mira has asked for the rare flower. */
const FLOWER_ASKED =
  `${characterName('Mira')} wants a [item_name]rare flower[/item_name] from the ` +
  '[room_name]Hidden Glade[/room_name], one that opens only for someone the land trusts. ' +
  'If it opens for you, she will know what she needs to know.'

/**
 * Side quest: seek guidance to unlock the secrets of Elior's newfound magic.
 * Its log moves on to the rare flower once Mira has asked for it.
 */
export class MagicForRealQuest extends Quest {
  constructor() {
    super({
      name: 'Magic for real',
      description: NOTHING_ANSWERS,
      completion:
        `The flower opened for you, and ${characterName('Mira')} showed you where the door is. ` +
        'Your spells answer now.',
    })
  }

  /** Starts with the first spell; opens at the flower when Mira already asked for it. */
  override checkTrigger(gameState: GameState): boolean {
    if (gameState.knownSpells.length === 0) return false
    if (gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE)) {
      this.setJournal([], FLOWER_ASKED)
    }
    return true
  }

  /** Once Mira has asked for the flower, the log moves on to it, once. */
  override checkUpdate(gameState: GameState): boolean {
    if (!gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE) || this.latestStage) {
      return false
    }
    this.setJournal([NOTHING_ANSWERS], FLOWER_ASKED)
    return true
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)
  }
}
