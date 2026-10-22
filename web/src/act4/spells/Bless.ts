import {
  Spell,
  type Character,
  type GameState,
  characterName,
  event,
} from '@/engine'
import { TrappedServants } from '../characters/TrappedServants'
import { KingAlden } from '../characters/KingAlden'
import { FLAG_ACT4_ELIXIR_ON_KING } from '../Act4StoryFlags'
import { endingPlayed } from '../endings'

/** A spell that channels divine energy to purify and free the corrupted. */
export class Bless extends Spell {
  constructor() {
    super({
      id: 'bless',
      name: 'bless',
      description:
        'Channels divine energy to purify corruption, break dark enchantments, ' +
        'and free those bound by shadow magic.',
    })
  }

  /** Cast bless spell without a specific target. */
  override castSpell(gameState: GameState): string {
    // Check if the current room has a castBless method and call it
    const room = gameState.currentRoom
    const hook = (room as { castBless?: (gs: GameState) => string }).castBless
    if (typeof hook === 'function') {
      return hook.call(room, gameState)
    }
    return event(
      'You channel divine energy, filling the area with warm, golden ' +
        'light, but there is nothing here that responds to the blessing.',
    )
  }

  /** Cast bless on a character: the servants through the courtyard, the king in or out of his crystal, anyone else a brief glow. */
  override castOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    if (targetCharacter instanceof TrappedServants) {
      // Special handling for servants
      const room = gameState.currentRoom
      const hook = (room as { castBless?: (gs: GameState) => string }).castBless
      if (typeof hook === 'function') {
        return hook.call(room, gameState)
      }
      return event(
        'You channel blessing energy toward the servants, but ' +
          'the magic seems unable to reach them fully here.',
      )
    }
    if (targetCharacter instanceof KingAlden) {
      if (
        endingPlayed(gameState) ||
        gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)
      ) {
        return event(
          'The king bows his head to the blessing, and the gold in his ' +
            'crown steadies a little. It is kindly meant, and kindly taken.',
        )
      }
      return event(
        'The blessing reaches him through the crystal, and for a moment the ' +
          'grey light running out of him slows. It is not enough. He does ' +
          'not wake.',
      )
    }
    return event(
      `You bless ${characterName(targetCharacter.name)} ` +
        'with divine energy, causing them to glow briefly with golden light.',
    )
  }
}
