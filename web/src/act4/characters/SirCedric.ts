import { Character, type GameState, dialogue } from '@/engine'

const OLD_LINE =
  'I have walked a long way beside you. This is a good place to stop.'

/**
 * Sir Cedric leaning on the fence of Willowbrook Field. The first talk
 * delivers the captain's and the knight's apologies; later talks are his one
 * old line.
 */
export class SirCedric extends Character {
  /** Whether Elior has already passed on the two apologies. */
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

  /** Both apologies and his answers the first time, his old line after. */
  override talkTo(_gameState: GameState): string {
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
      'Then what the knight in grey said: that he is sorry, and that he ' +
        'would say it to your face.',
      dialogue(
        'Sir Cedric',
        'The knight in grey. I thought I would want to hear that more than ' +
          'I do. Tell me where he is.',
      ),
      'He looks out over the field for a while.',
      dialogue('Sir Cedric', `Later. ${OLD_LINE}`),
    ].join('\n')
  }
}
