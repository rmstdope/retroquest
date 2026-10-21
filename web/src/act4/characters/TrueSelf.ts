import { Character, type GameState, dialogue, event } from '@/engine'
import { FLAG_ACT4_TRUTH_TOLD, VIRTUE_TRUTH } from '../Act4StoryFlags'
import { normaliseSpokenWord } from '../spokenWord'

/**
 * Elior's reflection in the plain mirror at the maze's heart, present once the
 * maze is solved. Optional: telling it the truth records the virtue "truth".
 */
export class TrueSelf extends Character {
  constructor() {
    super({
      name: 'True Self',
      description:
        "Your own reflection, in the plain mirror at the labyrinth's heart. " +
        'It does not copy you. It waits, watching, as if it already knows what ' +
        'you will say.',
    })
  }

  /** Also answers to "reflection". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'reflection'
  }

  /** The reflection's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }

  /** It asks why Elior came, and afterwards reminds him of the answer. */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_TRUTH_TOLD)) {
      return dialogue(
        this.name,
        'Remember what you told me, when you stand before him.',
      )
    }
    return dialogue(
      this.name,
      'You told Mira you came for the king. Tell me why you really came.',
    )
  }

  /** Saying "truth" confesses (once); anything else is shaken off. */
  override sayTo(gameState: GameState, words: string): string {
    if (normaliseSpokenWord(words) !== 'truth') {
      return '[dim]The reflection only shakes its head.[/dim]'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_TRUTH_TOLD)) {
      return '[dim]The reflection has heard your truth. It keeps still.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_TRUTH_TOLD, true)
    gameState.addVirtue(VIRTUE_TRUTH)
    return (
      event(
        'You tell it the truth: that you did not come only for the king. You ' +
          'came because you want Malakar to pay for what he took from you, and ' +
          'you are afraid of what that wanting makes you. The reflection nods, ' +
          "slowly. For a moment it wears your father's face. Then it is only " +
          'you again, standing a little straighter.',
      ) + '\n[dim]Elior will remember this.[/dim]'
    )
  }
}
