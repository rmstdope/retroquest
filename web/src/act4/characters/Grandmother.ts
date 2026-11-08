import {
  Character,
  type GameState,
  type Item,
  affirms,
  dialogue,
  speech,
} from '@/engine'
import { AncientAmulet } from '../items/AncientAmulet'
import { NyxToken } from '../items/NyxToken'

/** What she answers to the things Elior came home wanting to say. */
const ANSWERS: readonly { words: readonly string[]; answer: string }[] = [
  {
    words: ['knew'],
    answer: dialogue(
      'Grandmother',
      'I did. Every day of it. The bread will keep, and so will that.',
    ),
  },
  {
    words: ['love you'],
    answer:
      'She puts a floury hand against your cheek.\n' +
      dialogue('Grandmother', 'Hush. I know you do.'),
  },
  {
    words: ['welcome home'],
    answer: dialogue('Grandmother', 'That is my line, dear. Welcome home.'),
  },
  {
    words: ['forgive', 'forgiven', 'forgave'],
    answer: dialogue(
      'Grandmother',
      'I did not ask it of you. I am glad of it, all the same.',
    ),
  },
  {
    words: ['should have told', 'should have said'],
    answer: dialogue(
      'Grandmother',
      'I should have. I promised her, and I should have told you anyway.',
    ),
  },
]

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

  /** The things he came home to say get her own answer; the rest her deflection. */
  override sayTo(gameState: GameState, words: string): string {
    return (
      ANSWERS.find((entry) => affirms(words, entry.words))?.answer ??
      super.sayTo(gameState, words)
    )
  }

  /** Anything else said to her waits for the table. */
  protected override unknownWordAnswers(): readonly string[] {
    return [
      speech('Tell me at the table, dear. The bread will keep.'),
      speech('Later, dear. The field first.'),
    ]
  }

  /** The amulet and the token are not hers to take, and she says whose they are. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof AncientAmulet) {
      return dialogue(
        'Grandmother',
        'No, dear. That was never mine to hold, and it is not now.',
      )
    }
    if (item instanceof NyxToken) {
      return dialogue(
        'Grandmother',
        'Not mine, dear. Someone in that hedge has been looking at your ' +
          'pocket all morning.',
      )
    }
    return super.giveItem(gameState, item)
  }
}
