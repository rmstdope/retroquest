import {
  characterName,
  flagStage,
  Quest,
  type GameState,
  type QuestStage,
} from '@/engine'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_MIRA_MET,
} from '../Act1StoryFlags'
import { RareFlower } from '../items/RareFlower'

/** The opening, before Mira has asked for anything. */
const NOTHING_ANSWERS =
  'You know a spell now, but when you reach for it the warmth comes and nothing answers. ' +
  `${characterName('Grandmother')} says ${characterName('Mira')} has a way with herbs, ` +
  'and with other things.'

/** The log, and so the hint, once Mira is met and wants to hear what Elior has seen. */
const MIRA_WAITS =
  `${characterName('Mira')} will not talk about your magic yet. ` +
  'Something is wrong in the village, and she wants to hear what you have ' +
  'seen of it first.'

/** The log once Mira has asked for the rare flower: still about the spell, not her request. */
const FLOWER_ASKED =
  'Your spells do not answer yet. ' +
  `${characterName('Mira')} has sent you for a [item_name]rare flower[/item_name] from the ` +
  '[room_name]Hidden Glade[/room_name]: if it opens for you, she will know what holds your magic back.'

/** The hint while Elior carries the flower that opened for him, not yet given. */
const FLOWER_IN_HAND =
  'The [item_name]rare flower[/item_name] opened for you. ' +
  `${characterName('Mira')} will know what holds your magic back once she has it.`

/**
 * Side quest: seek guidance to unlock the secrets of Elior's newfound magic.
 * Its log adds Mira's wish to hear what he has seen once he has met her, moves
 * on to the rare flower once she has asked for it, and its
 * hint sends the flower back to her once it is in hand.
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
    this.checkUpdate(gameState)
    return true
  }

  /** The opening, before Mira has asked for anything. */
  protected override opening(): string {
    return NOTHING_ANSWERS
  }

  /**
   * Once Mira is met, the log says she waits to hear what he has seen (not when
   * she asks for the flower in that very talk); once she has asked, it moves on.
   */
  protected override stages(): QuestStage[] {
    return [
      {
        key: FLAG_MIRA_MET,
        reached: (gameState) =>
          gameState.getStoryFlag(FLAG_MIRA_MET) &&
          !gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE),
        log: MIRA_WAITS,
      },
      flagStage(FLAG_CONNECT_WITH_NATURE, FLOWER_ASKED),
    ]
  }

  /**
   * Sends the flower in hand back to Mira, since the log still wonders whether
   * the glade will open; otherwise the newest log entry, as every quest does.
   */
  override hint(gameState: GameState): string | null {
    if (
      gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE) &&
      gameState.inventory.some((item) => item instanceof RareFlower)
    ) {
      return FLOWER_IN_HAND
    }
    return super.hint(gameState)
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)
  }
}
