import {
  Spell,
  type Character,
  type GameState,
  characterName,
  clue,
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
        `The blessing the ${characterName('priest')} said over you when you found the founders' ` +
        'locket.',
    })
  }

  /** Give a save made before the Act IV wording review the current description. */
  override refreshSavedText(): void {
    this.description = new Bless().description
  }

  /** Cast bless spell without a specific target. */
  override castSpell(gameState: GameState): string {
    // Check if the current room has a castBless method and call it
    const room = gameState.currentRoom
    const hook = (room as { castBless?: (gs: GameState) => string }).castBless
    if (typeof hook === 'function') {
      return hook.call(room, gameState)
    }
    return (
      'You channel divine energy, filling the area with warm, golden ' +
      'light, but there is nothing here that responds to the blessing.'
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
      return clue('The magic seems unable to reach the servants fully here.')
    }
    if (targetCharacter instanceof KingAlden) {
      if (
        endingPlayed(gameState) ||
        gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)
      ) {
        return (
          'The king bows his head to the blessing, and something in his ' +
          'crown stirs toward the light. It is kindly meant, and kindly taken.'
        )
      }
      return (
        'The blessing reaches him through the crystal, and for a moment the ' +
        'grey light running out of him slows. It is not enough. He does ' +
        'not wake.'
      )
    }
    return `Golden light gathers briefly around ${targetCharacter.nameInSentence()}.`
  }
}
