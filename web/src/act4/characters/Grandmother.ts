import { Character, type GameState, dialogue } from '@/engine'

/**
 * Grandmother at the gate of Willowbrook Field. The first talk carries the
 * parents' message; later talks only send Elior on to the field.
 */
export class Grandmother extends Character {
  /** Whether Elior has already told her what his parents said. */
  talked = false

  constructor() {
    super({
      name: 'Grandmother',
      description:
        'Your grandmother, waiting at the gate with her hands folded.',
    })
  }

  /** The message the first time, her short line after. */
  override talkTo(_gameState: GameState): string {
    const send = 'Go on, love. The field has waited long enough.'
    if (this.talked) return dialogue('Grandmother', send)
    this.talked = true
    return [
      dialogue('Grandmother', 'You saw them. I can see it in your face.'),
      'You tell her what they said: that they are proud of her, that they ' +
        'are resting.',
      dialogue('Grandmother', `Resting. Good. Then so can we. ${send}`),
    ].join('\n')
  }
}
