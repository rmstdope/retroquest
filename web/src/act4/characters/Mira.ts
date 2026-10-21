import { Character, type GameState, dialogue } from '@/engine'
import { endingPlayed, type Ending } from '../endings'

/** What Elior tells Mira and what she answers, by ending. */
const LINES: Record<Ending, [string, string]> = {
  redemption: [
    'You tell her what Malakar said: that he is sorry, and that he ' +
      'remembers her.',
    'He remembers. Then I will go and see him, one day. Not yet.',
  ],
  justice: [
    'You tell her Malakar is sealed away.',
    'Good. And I am sorry, both at once. He taught me my first spell, too.',
  ],
  sacrifice: [
    'She takes your hands and feels how quiet they are.',
    'All of it? Oh, Elior. Then I will teach you again, slowly, if you ' +
      'want to learn.',
  ],
}

/** What Elior tells Mira about Elena, and her answer, the same in every ending. */
const ELENA_TOLD =
  'You tell her, too, what the Sorceress asked you to carry: that she is ' +
  'sorry, and that Elena should hear it.'
const ELENA_ANSWER =
  'Elena. I am going back through Greendale. I will tell her.'

/**
 * Mira in Willowbrook Field: her line follows the ending, and the first talk
 * adds Elena's message from the Sorceress.
 */
export class Mira extends Character {
  /** Whether Elior has already passed on Elena's message. */
  delivered = false

  constructor() {
    super({
      name: 'Mira',
      description: 'Mira, standing beside Grandmother at the gate.',
    })
  }

  /** Her ending line; the first time, Elena's message follows it. */
  override talkTo(gameState: GameState): string {
    const [told, answer] = LINES[endingPlayed(gameState) ?? 'redemption']
    const lines = [told, dialogue('Mira', answer)]
    if (!this.delivered) {
      this.delivered = true
      lines.push(ELENA_TOLD, dialogue('Mira', ELENA_ANSWER))
    }
    return lines.join('\n')
  }
}
