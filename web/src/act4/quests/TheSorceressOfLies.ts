import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_BADGE_SHOWN,
  FLAG_ACT4_HEARTS_TRUTH_CAST,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
  FLAG_ACT4_STAFF_HEARD,
  FLAG_ACT4_WHISPERS_HEARD,
} from '../Act4StoryFlags'

/** The log when the quest opens. */
const OPENING_ENTRY =
  'At the top of the tower the Sorceress of Lies holds court, and the ' +
  "mask on her staff is the mark from Elena's wrist. Listen past her " +
  'lies, to what is under them.'

/** The log once the knight's badge is shown to her. */
const BADGE_ENTRY =
  "\n\nHer smile slipped at the knight's badge. " +
  'Under the whispers a small voice is not lying, ' +
  'too quietly for ears alone.'

/** The log once some, but not all, of the chamber's three hearts are heard. */
const SOME_HEARD_ENTRY =
  '\n\nYou have heard some of her, but not all. ' +
  'There is more in this chamber that is hers to listen to.'

/** The log once all three hearts are heard. */
const ALL_HEARD_ENTRY =
  '\n\nUnder the lies she is alone, as she has always been. ' +
  'Her parents sold her for a sack of grain in a hungry winter, ' +
  'and no one has ever spoken to her without a lie.'

/** The newest entry once every heart is heard. */
const READY_ENTRY =
  '\n\nYou have heard all of her. ' +
  'In all her years no one has understood a word she said. ' +
  'You could be the first.'

/** What the log says once she is redeemed. */
const COMPLETION_TEXT =
  "Elior listens past the Sorceress's lies and answers the loneliness " +
  'beneath them. She confesses the curse on Elena, and the arch to the ' +
  'north opens.'

/**
 * Side quest: listen past the Sorceress of Lies and answer her loneliness.
 * Its log moves on with the knight's badge shown to her and the three hearts
 * of the chamber (hers, the staff's, the whispering crystals') heard.
 */
export class TheSorceressOfLies extends Quest {
  constructor() {
    super({
      name: 'The Sorceress of Lies',
      description: OPENING_ENTRY,
      completion: COMPLETION_TEXT,
    })
  }

  /** Start on first entering the Chamber of Whispers (or first meeting her). */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)
    )
  }

  /**
   * Rebuild the log from the badge and the hearts (heard only with the
   * Heart's Truth the badge teaches, so never without it). Reports a change only when
   * the rebuilt log differs, so an older save's one-line log is brought level
   * too.
   */
  override checkUpdate(gameState: GameState): boolean {
    const badge = gameState.getStoryFlag(FLAG_ACT4_BADGE_SHOWN)
    const heard = [
      FLAG_ACT4_HEARTS_TRUTH_CAST,
      FLAG_ACT4_STAFF_HEARD,
      FLAG_ACT4_WHISPERS_HEARD,
    ].filter((flag) => gameState.getStoryFlag(flag)).length
    const entries = [OPENING_ENTRY]
    if (badge) entries.push(BADGE_ENTRY)
    if (heard > 0 && heard < 3) entries.push(SOME_HEARD_ENTRY)
    if (heard === 3) entries.push(ALL_HEARD_ENTRY, READY_ENTRY)
    const before = this.description
    this.completion = COMPLETION_TEXT
    this.setJournal(entries.slice(0, -1), entries[entries.length - 1])
    return this.description !== before
  }

  /** Complete when the Sorceress is redeemed. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)
  }
}
