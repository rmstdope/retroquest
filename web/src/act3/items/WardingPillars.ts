import { Item, clue, type GameState } from '@/engine'
import {
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_WARDING_PILLARS_PURIFIED,
} from '../Act3StoryFlags'
import { MoonRuneShards } from './MoonRuneShards'

/**
 * Tideward ritual pillars requiring purification. `purify()` transitions state,
 * affecting examine text and enabling the shard engraving.
 */
export class WardingPillars extends Item {
  purified = false

  constructor() {
    super({
      name: 'Warding Pillars',
      description:
        'Three weathered pillars ring a drowned courtyard; glyph-lines are ' +
        'clogged with brine and coral crust that must be cleared to restore ' +
        'their ward function.',
      shortName: 'Pillars',
      canBeCarried: false,
    })
  }

  /** Prevent pickup of the immovable warding pillars. */
  override preventPickup(): string {
    return clue(
      `You can't take ${this.nameInSentence()}. ` +
        'They are fixed stone, older than the pier.',
    )
  }

  /** Examine the warding pillars showing their current purification state. */
  override examine(_gameState: GameState): string {
    // Return completely different strings depending on purification state.
    if (this.purified) {
      // Pulsating, radiant description when purified.
      return (
        'The pillars pulse with a quiet, radiant rhythm. Light seems to ' +
        'gather in the carved channels, a steady heartbeat that draws the tide ' +
        'toward the stone. The air tastes of moonwater; the ward answers, ready ' +
        'to pull the sea back when the sigil is set.'
      )
    }
    // Dark, faint-hum description when not purified.
    return (
      'The pillars stand mute in the dim, their faces ringed with crust and ' +
      'shadow. A faint, weary hum hides under the stone, a thread of old magic ' +
      'barely holding. They watch the water but do not command it.'
    )
  }

  /** Purify the pillars, enabling their use in the Tideward Sigil quest. */
  purify(gameState: GameState): string {
    if (this.purified) {
      return '[dim]The pillars are already cleansed of brine and coral.[/dim]'
    }
    this.purified = true
    // Update the item's displayed name to reflect purified state.
    this.name = 'Warding Pillars (purified)'
    // Mark purification story flag so other systems can react to the change.
    gameState.setStoryFlag(FLAG_ACT3_WARDING_PILLARS_PURIFIED, true)
    return (
      'You rinse salt and scrape coral from the carved channels. Glyph-lines ' +
      'breathe again, ready to take the Tideward Sigil.'
    )
  }

  /**
   * Engrave the pillars when used with Moon Rune Shards: the pillars must be
   * purified; the shards are consumed and the sigils flag is set.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (!(other instanceof MoonRuneShards)) {
      return super.useWith(gameState, other)
    }
    // Now handle engraving flow
    if (!this.purified) {
      return clue(
        'The carved channels are still clogged with crust. The shards ' +
          'will not take until the pillars are cleansed.',
      )
    }
    // Consume shards and set story flag
    gameState.removeItemFromInventory(other.name)
    gameState.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    return (
      'You press the pale shards into the cleansed grooves. Pale runes ' +
      'flare and sink into the stone like stored moonlight. The air leans in; ' +
      'a pull runs through the courtyard as the tide answers the sigils, ' +
      'and the sea draws back from the drowned hall to the south.'
    )
  }
}
