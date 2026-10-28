import { Character, type GameState, characterName, dialogue } from '@/engine'
import {
  FLAG_ACT4_ELENA_MESSAGE_HEARD,
  FLAG_ACT4_MALAKAR_MESSAGE_HEARD,
} from '../Act4StoryFlags'
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
    'Good. And I am sorry, both at once. He taught me my first spell.',
  ],
  sacrifice: [
    'She takes your hands and feels how quiet they are.',
    'All of it? Oh, Elior. Then I will teach you herbs, the slow way, if ' +
      'you want to learn.',
  ],
}

/** The Redemption lines when Elior never heard Malakar's message for her. */
const REDEMPTION_UNHEARD: [string, string] = [
  'You tell her Malakar is himself again, and alive.',
  'Himself. Then I will go and see him, one day. Not yet.',
]

/** What Elior tells Mira about Elena, and her answer, the same in every ending. */
const ELENA_TOLD =
  'You tell her, too, what the Sorceress asked you to carry: that she is ' +
  'sorry, and that Elena should hear it.'
const ELENA_ANSWER =
  'Elena. I am going back through Greendale; I owe Lyria an answer to a ' +
  'letter. I will tell her.'

/**
 * Mira in Willowbrook Field: her line follows the ending, and the first talk
 * adds Elena's message from the Sorceress. Each message is passed on only if
 * Elior heard it in the fortress.
 */
export class Mira extends Character {
  /** Whether Elior has already passed on Elena's message. */
  delivered = false

  constructor() {
    super({
      name: 'Mira',
      description: `${characterName('Mira')}, standing beside ${characterName('Grandmother')} at the gate.`,
    })
  }

  /** Her ending line; the first time, Elena's message follows it. */
  override talkTo(gameState: GameState): string {
    const ending = endingPlayed(gameState) ?? 'redemption'
    const [told, answer] =
      ending === 'redemption' &&
      !gameState.getStoryFlag(FLAG_ACT4_MALAKAR_MESSAGE_HEARD)
        ? REDEMPTION_UNHEARD
        : LINES[ending]
    const lines = [told, dialogue('Mira', answer)]
    if (
      !this.delivered &&
      gameState.getStoryFlag(FLAG_ACT4_ELENA_MESSAGE_HEARD)
    ) {
      this.delivered = true
      lines.push(ELENA_TOLD, dialogue('Mira', ELENA_ANSWER))
    }
    return lines.join('\n')
  }
}
