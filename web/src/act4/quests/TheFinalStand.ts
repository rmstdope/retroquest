import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_FINAL_STAND_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_MAIN_STARTED,
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
} from '../Act4StoryFlags'

/** The log when the act opens: the king held, and the vow to make Malakar pay. */
const OPENING_ENTRY =
  "Malakar's fortress. Somewhere inside it King Alden is held, " +
  'and Malakar waits for you. ' +
  'You came to free the king, and to make Malakar pay for what he took.'

/** The beat after the Knight of Despair has confessed. */
const KNIGHT_ENTRY =
  '\n\nThe Knight of Despair was the stranger from Willowbrook. ' +
  'He fouled the well, framed Sir Cedric and let the king be taken, ' +
  "and he confessed it to Sir Cedric's face."

/** The beat after the Shadow has said its words whole. */
const SHADOW_ENTRY =
  "\n\nThe voice from your dreams is what is left of Malakar's better self. " +
  'It said its words whole at last: Be patient where I was not. ' +
  'Close what I opened, and let them rest.'

/** The beat after the vault: the parents, the ward, and the way to Malakar. */
const VAULT_ENTRY =
  '\n\nIn the vault you saw it all. ' +
  'Malakar tore at time to save your parents from the Wasting. ' +
  'They poured themselves into the ward that holds his wound shut, ' +
  'and the ward lives in you. Malakar waits past the north door.'

/** What the log says once the wound is closed. */
const COMPLETION_TEXT =
  'The wound is closed and the king is free. Your parents are at rest.'

/**
 * The main quest of Act IV: break into Malakar's fortress and face him. It
 * starts when the act opens, its log grows with the three revelations (the
 * knight, the Shadow, the vault) and it completes when the Throne Chamber's
 * wound is closed in Redemption, Justice or Sacrifice.
 */
export class TheFinalStand extends Quest {
  constructor() {
    super({
      name: 'The Final Stand',
      description: OPENING_ENTRY,
      completion: COMPLETION_TEXT,
    })
  }

  /** Start with the act. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_MAIN_STARTED)
  }

  /**
   * Rebuild the log from the revelation flags, in story order. Reports a
   * change only when the rebuilt log differs, so a save made with the old
   * one-line log is brought level too, closing words included.
   */
  override checkUpdate(gameState: GameState): boolean {
    const beats: [string, string][] = [
      [FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, KNIGHT_ENTRY],
      [FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, SHADOW_ENTRY],
      [FLAG_ACT4_PARENTS_LEGACY_COMPLETED, VAULT_ENTRY],
    ]
    const entries = [OPENING_ENTRY]
    for (const [flag, entry] of beats)
      if (gameState.getStoryFlag(flag)) entries.push(entry)
    const before = this.description
    this.completion = COMPLETION_TEXT
    this.setJournal(entries.slice(0, -1), entries[entries.length - 1])
    return this.description !== before
  }

  /** Complete when the wound is closed in one of the three endings. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_FINAL_STAND_COMPLETED)
  }

  /** This is the main quest of Act IV. */
  override isMain(): boolean {
    return true
  }
}
