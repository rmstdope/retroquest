import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_BANNERS_SEEN,
  FLAG_ACT4_CHAIN_GIVEN,
  FLAG_ACT4_ECHO_STONE_HEARD,
  FLAG_ACT4_GUARDIANS_CHAIN_RAISED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
  FLAG_ACT4_KNIGHT_SEEN_THROUGH,
  FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL,
} from '../Act4StoryFlags'

/** The log when the quest opens. */
const OPENING_ENTRY =
  'A knight in a grey cloak stands before the stair to the Tower of ' +
  'Shadows and does not move. Learn the truth of him, and find a way ' +
  'past.'

/** The log once some, but not all, of the hall's three sights are seen. */
const SOME_SEEN_ENTRY =
  '\n\nYou have seen something of the knight, but not all of him. ' +
  'There is more in this hall to see through.'

/** The log once all three sights are seen. */
const ALL_SEEN_ENTRY =
  '\n\nHe served King Alden before he ever served Malakar. ' +
  'The voice in the stone that keeps saying redemption is his, ' +
  'and behind the visor he is weeping.'

/** The newest entry while nothing stands between Elior and the knight's despair. */
const UNSHIELDED_ENTRY =
  '\n\n' +
  "When you face him, the knight's despair rolls over you like cold water, " +
  'and nothing stands between you and it.'

/** The newest entry once the despair cannot reach Elior. */
const SHIELDED_ENTRY =
  '\n\nHis despair cannot reach you now. ' +
  'He is still waiting for the word the stone keeps saying.'

/** What the log says once the knight is redeemed. */
const COMPLETION_TEXT =
  'Elior sees the knight as he truly is and offers him redemption ' +
  'instead of a blade. The man who framed Sir Cedric confesses, and ' +
  'the stair to the Tower of Shadows lies open.'

/**
 * Side quest: see the Knight of Despair as he truly is, and redeem him. Its
 * log moves on with the three sights of the hall (the knight, the banners,
 * the Echo Stone) and with the shield against his despair (the Guardian's
 * Chain still carried, or the Loyalty Token raised in the hall).
 */
export class TheKnightOfDespair extends Quest {
  constructor() {
    super({
      name: 'The Knight of Despair',
      description: OPENING_ENTRY,
      completion: COMPLETION_TEXT,
    })
  }

  /** Start on first entering the Hall of Echoes (or first meeting the knight). */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)
    )
  }

  /**
   * Rebuild the log from the sights and the shield. Reports a change only
   * when the rebuilt log differs, so an older save's one-line log is brought
   * level too.
   */
  override checkUpdate(gameState: GameState): boolean {
    const seen = [
      FLAG_ACT4_KNIGHT_SEEN_THROUGH,
      FLAG_ACT4_BANNERS_SEEN,
      FLAG_ACT4_ECHO_STONE_HEARD,
    ].filter((flag) => gameState.getStoryFlag(flag)).length
    const shielded =
      (gameState.getStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED) &&
        !gameState.getStoryFlag(FLAG_ACT4_CHAIN_GIVEN)) ||
      gameState.getStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL)
    const entries = [OPENING_ENTRY]
    if (seen > 0 && seen < 3) entries.push(SOME_SEEN_ENTRY)
    if (seen === 3)
      entries.push(ALL_SEEN_ENTRY, shielded ? SHIELDED_ENTRY : UNSHIELDED_ENTRY)
    const before = this.description
    this.completion = COMPLETION_TEXT
    this.setJournal(entries.slice(0, -1), entries[entries.length - 1])
    return this.description !== before
  }

  /** Complete when the knight is redeemed. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)
  }
}
