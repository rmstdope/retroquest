import {
  affirms,
  Character,
  type GameState,
  clue,
  dialogue,
  remembered,
  saysAnyOf,
  type NameOptions,
} from '@/engine'
import { FLAG_ACT4_TRUTH_TOLD, VIRTUE_TRUTH } from '../Act4StoryFlags'

/** Words that tell the reflection the truth: the confession names revenge. */
const TRUTH_WORDS = ['truth', 'revenge', 'vengeance']

/** The likeliest wrong answer: the king, true but not all of it. */
const KING_WORDS = ['king', 'alden']

/**
 * Elior's reflection in the plain mirror at the maze's heart, present once the
 * maze is solved. Optional: telling it the truth records the virtue "truth".
 */
export class TrueSelf extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

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
    return this.description
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
      'You tell everyone you came for the king. Tell me the truth: why did ' +
        'you really come?',
    )
  }

  /**
   * Saying the truth confesses (once): "truth", "revenge" or "vengeance" as a
   * whole word, alone or in a sentence, unless the sentence denies it. The
   * king is the likeliest wrong answer and gets its own reply; anything else
   * is waited out.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (!affirms(words, TRUTH_WORDS)) {
      if (saysAnyOf(words, KING_WORDS)) {
        return dialogue(
          this.name,
          'That is what you tell everyone. It is true. It is not all of it.',
        )
      }
      return clue(
        'The reflection waits. It has heard you say easier things than that.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_TRUTH_TOLD)) {
      return '[dim]The reflection has heard your truth. It keeps still.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_TRUTH_TOLD, true)
    gameState.addVirtue(VIRTUE_TRUTH)
    return (
      'You tell it the truth: that you did not come only for the king. You ' +
      'came because you want Malakar to pay for what he took from you, and ' +
      'you are afraid of what that wanting makes you. The reflection nods, ' +
      "slowly. For a moment it wears your father's face. Then it is only " +
      'you again, standing a little straighter.' +
      '\n' +
      remembered('Truth')
    )
  }
}
