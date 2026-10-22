import { Character, type GameState, dialogue } from '@/engine'

/**
 * Grandmother at the gate of Willowbrook Field. The first talk names the
 * cradle song, answers for having known all along, then carries the
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
      dialogue('Grandmother', "Your mother's. I didn't think you'd remember."),
      dialogue('Grandmother', 'You saw them. I can see it in your face.'),
      '“You knew,” you say. It is not a question.',
      dialogue(
        'Grandmother',
        'I knew. She made me promise, the night she went. I have not slept ' +
          'a whole night since.',
      ),
      'You tell her what they said: that they are proud of her, that they ' +
        'are resting.',
      dialogue('Grandmother', `Resting. Good. Then so can we. ${send}`),
    ].join('\n')
  }
}
