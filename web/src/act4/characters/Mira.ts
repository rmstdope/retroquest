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

/** Mira in Willowbrook Field: her one line follows the ending. */
export class Mira extends Character {
  constructor() {
    super({
      name: 'Mira',
      description: 'Mira, standing beside Grandmother at the gate.',
    })
  }

  /** The same line every time, by ending. */
  override talkTo(gameState: GameState): string {
    const [told, answer] = LINES[endingPlayed(gameState) ?? 'redemption']
    return `${told}\n${dialogue('Mira', answer)}`
  }
}
