import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
} from '../Act3StoryFlags'

/**
 * Side quest to recover and repair brass mirror segments for Mount Ember.
 *
 * Objectives:
 * - Recover brass mirror segments from the Obsidian Outcrops.
 * - Mount and repair mirrors on the Mirror Terraces to form a continuous
 *   light channel that opens the way to the Phoenix Crater.
 */
export class MirrorsOfEmberlightQuest extends Quest {
  constructor() {
    super({
      name: 'Mirrors of Emberlight',
      description:
        'The terraces are lined with old, cracked mirrors. Find a way to repair the ' +
        'mirrors and restore the channel of light to the high altar.',
      completion:
        'You gathered the brass mirror segments, mended the mount on the terraces, ' +
        'and let the noon sun fire the beam that opened the way into the mountain.',
    })
  }

  /** Give a save made with older wording the current log, once the quest is offered. */
  override refreshSavedText(gameState: GameState): void {
    if (gameState.nonActivatedQuests.includes(this)) return
    const fresh = new MirrorsOfEmberlightQuest()
    this.description = fresh.description
    this.completion = fresh.completion
  }

  /** Trigger when the player first arrives at Mount Ember (Lower Switchbacks). */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED)
  }

  /** Return true when the mirrors have been fully mounted and repaired. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED)
  }
}
