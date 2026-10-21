import { Character, type GameState, dialogue } from '@/engine'
import { FLAG_ACT4_CEDRIC_FORGAVE } from '../Act4StoryFlags'

const OLD_LINE =
  'I have walked a long way beside you. This is a good place to stop.'

/**
 * Sir Cedric leaning on the fence of Willowbrook Field. The first talk
 * delivers the captain's apology and his word on the knight; later talks are his one
 * old line.
 */
export class SirCedric extends Character {
  /** Whether Elior has already passed on the captain's apology. */
  delivered = false

  constructor() {
    super({
      name: 'Sir Cedric',
      description: 'Sir Cedric, leaning on the fence as if it were a wall.',
    })
  }

  /** Also answers to "cedric". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'cedric'
  }

  /** The captain's apology and his choice about the knight the first time, his old line after. */
  override talkTo(gameState: GameState): string {
    if (this.delivered) return dialogue('Sir Cedric', OLD_LINE)
    this.delivered = true
    return [
      'You tell him what the captain of the guard said: that he is sorry he ' +
        'ever doubted him.',
      dialogue(
        'Sir Cedric',
        'He was the youngest on the walls that night. I never blamed him. I ' +
          'am glad he remembers.',
      ),
      dialogue(
        'Sir Cedric',
        gameState.getStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE)
          ? 'And the knight in grey said his piece to my face. I forgave ' +
              'him. I find I meant it.'
          : 'And the knight in grey said his piece to my face. I have not ' +
              'forgiven him. Not yet.',
      ),
      dialogue('Sir Cedric', `Later. ${OLD_LINE}`),
    ].join('\n')
  }
}
