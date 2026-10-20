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
        'The terraces are lined with ancient, cracked mirrors. Find a way to repair the ' +
        'mirrors and restore the channel of light to the high altar.',
      completion:
        'Elior gathers the scattered brass mirror segments and, with care and skill, ' +
        'restores the ancient light channel atop Mount Ember. The mirrors blaze with ' +
        "reflected sunlight, opening the way to the volcano's heart and the Phoenix's " +
        'trial of wisdom.',
    })
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
