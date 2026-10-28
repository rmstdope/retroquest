import { Character, type GameState, dialogue } from '@/engine'

/**
 * Grandmother at the gate of Willowbrook Field. The first talk names the
 * cradle song, answers for having known all along, then carries the
 * parents' message; later talks only send Elior on to the field.
 */
export class Grandmother extends Character {
  /** How she looks; a constant, so old saves get the current words. */
  private static readonly DESCRIPTION =
    'Your grandmother at the gate, flour still on her apron. For once her ' +
    'hands are still.'

  /** Whether Elior has already told her what his parents said. */
  talked = false

  constructor() {
    super({ name: 'Grandmother', description: Grandmother.DESCRIPTION })
  }

  /** Her look, always in the current words. */
  override examine(_gameState: GameState): string {
    return Grandmother.DESCRIPTION
  }

  /** The message the first time, her short line after. */
  override talkTo(_gameState: GameState): string {
    const send = 'Go on, dear. The field first. The bread will keep.'
    if (this.talked) return dialogue('Grandmother', send)
    this.talked = true
    return [
      dialogue('Grandmother', "Your mother's. I didn't think you'd remember."),
      dialogue('Grandmother', 'You saw them. I can see it in your face.'),
      dialogue('Elior', 'You knew.'),
      'It is not a question.',
      dialogue(
        'Grandmother',
        'I knew. She made me promise, the night she went. ' +
          'I have not slept a whole night since.',
      ),
      'You tell her what they said: that they are proud of her, that they ' +
        'are resting.',
      dialogue('Grandmother', `Resting. Good. Then so can we. ${send}`),
    ].join('\n')
  }
}
