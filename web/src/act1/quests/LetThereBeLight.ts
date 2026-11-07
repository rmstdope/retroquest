import { characterName, Quest, type GameState } from '@/engine'
import { Candle } from '../items/Candle'
import { Matches } from '../items/Matches'
import {
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_PRIEST_TALKED_TO,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
} from '../Act1StoryFlags'

/** The opening while the priest's matches are still at the store. */
const OUT_OF_MATCHES =
  `The ${characterName('priest')} is out of matches and his candle is cold. ` +
  `${characterName('Hemlock')} at the General Store keeps a box for him.`

/** The hint while the store is shut: the matches wait on Hemlock's cat. */
const MATCHES_WAIT_ON_PATCHES =
  `${characterName('Hemlock')} keeps the box under his counter, ` +
  `but he will see to the ${characterName('priest')} only once ` +
  `${characterName('Patches')} is home.`

/** The log once Elior has the matches in hand. */
const MATCHES_IN_HAND =
  `${characterName('Hemlock')} gave you the box of matches. ` +
  'The candle by the altar in the chapel is still cold.'

/**
 * Side quest: bring light to the chapel for the priest. Its log moves on
 * from Hemlock to the cold candle once Elior holds the matches.
 */
export class LetThereBeLightQuest extends Quest {
  constructor() {
    super({
      name: 'Let there be light',
      description: OUT_OF_MATCHES,
      completion:
        'The candle is lit, and in the dark corner by the altar its light found a locket.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_PRIEST_TALKED_TO)
  }

  /** Once Elior holds the matches, the log moves on to the cold candle, once. */
  override checkUpdate(gameState: GameState): boolean {
    if (
      this.latestStage ||
      !gameState.inventory.some((item) => item instanceof Matches)
    ) {
      return false
    }
    this.setJournal([OUT_OF_MATCHES], MATCHES_IN_HAND)
    return true
  }

  /**
   * While the General Store is shut and the matches are still there, says
   * that Hemlock sees to them only once Patches is home; otherwise the
   * newest log entry, as every quest does. The store is open on the same
   * flags as Hemlock's own `isOpen`.
   */
  override hint(gameState: GameState): string | null {
    const storeOpen =
      gameState.getStoryFlag(FLAG_PATCHES_RETURNED) ||
      gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER) ||
      gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    if (!storeOpen && !this.latestStage) return MATCHES_WAIT_ON_PATCHES
    return super.hint(gameState)
  }

  override checkCompletion(gameState: GameState): boolean {
    const candle = gameState.getItem('candle')
    return candle instanceof Candle && candle.isLit
  }
}
