import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_SHADOW_MASK_SHOWN,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED,
} from '../Act4StoryFlags'

/** The log when the quest opens. */
const OPENING_ENTRY =
  'Among the broken memories a shadow reaches for scenes it cannot ' +
  'hold. Mend what it has lost, and learn whose voice it is.'

/** The log once the orbs are mended and the Shadow has a face. */
const MENDED_ENTRY =
  '\n\nThe orbs are whole, and the Shadow has a face. ' +
  'It looks at the mended memories the way a man looks at a door ' +
  'he does not expect to open again.'

/** The log once the Sorceress's mask is shown to it. */
const MASK_ENTRY =
  '\n\nThe Shadow turned the mask over and gave it back. ' +
  'If she could choose the truth, perhaps he can too. ' +
  'Its words are still waiting for an answer: Be patient where I was not.'

/** What the log says once the Shadow is answered. */
const COMPLETION_TEXT =
  'Elior learns that the voice from his dreams is what remains of ' +
  "Malakar's better self. The sealed door to the east now answers to " +
  'the amulet.'

/**
 * Side quest: mend the Memory Vault's orbs and answer the Shadow of the Past.
 * Its log moves on when the orbs are mended and when the Sorceress's mask is
 * shown to it.
 */
export class TheShadowOfThePast extends Quest {
  constructor() {
    super({
      name: 'The Shadow of the Past',
      description: OPENING_ENTRY,
      completion: COMPLETION_TEXT,
    })
  }

  /** Start on first entering the Memory Vault (or first meeting the Shadow). */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)
    )
  }

  /**
   * Rebuild the log from the orbs and the mask. Reports a change only when
   * the rebuilt log differs, so an older save's one-line log is brought level
   * too.
   */
  override checkUpdate(gameState: GameState): boolean {
    const entries = [OPENING_ENTRY]
    if (gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED))
      entries.push(MENDED_ENTRY)
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_MASK_SHOWN))
      entries.push(MASK_ENTRY)
    const before = this.description
    this.completion = COMPLETION_TEXT
    this.setJournal(entries.slice(0, -1), entries[entries.length - 1])
    return this.description !== before
  }

  /** Complete when the Shadow is answered. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)
  }
}
