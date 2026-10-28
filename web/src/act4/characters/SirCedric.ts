import { Character, type GameState, dialogue, effect } from '@/engine'
import {
  FLAG_ACT4_CAPTAIN_APOLOGY_HEARD,
  FLAG_ACT4_CEDRIC_FORGAVE,
} from '../Act4StoryFlags'

const OLD_LINE =
  'I have walked a long way beside you. This is a good place to stop.'

/**
 * What Sir Cedric says of the knight at home, by whether he forgave him;
 * after the captain's apology it opens with "And".
 */
function knightLine(forgave: boolean, afterCaptain: boolean): string {
  const said =
    `${afterCaptain ? 'And the' : 'The'} knight in grey said his piece to ` +
    'my face.'
  return forgave
    ? `${said} I forgave him. I find I meant it.`
    : `${said} I have not forgiven him. Not yet.`
}

/**
 * Sir Cedric leaning on the fence of Willowbrook Field. The first talk gives
 * his word on the knight, after the captain's apology if Elior heard it from
 * the freed captain; later talks are his one old line.
 */
export class SirCedric extends Character {
  /** Whether Elior has already had the first talk with him at home. */
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

  /**
   * The first time: the captain's apology (only if Elior heard it) and his
   * choice about the knight; his old line after.
   */
  override talkTo(gameState: GameState): string {
    if (this.delivered) return dialogue('Sir Cedric', OLD_LINE)
    this.delivered = true
    const forgave = gameState.getStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE)
    const lines: string[] = []
    if (gameState.getStoryFlag(FLAG_ACT4_CAPTAIN_APOLOGY_HEARD)) {
      lines.push(
        effect(
          "You give him the captain of the guard's apology, for ever " +
            'doubting him.',
        ),
        dialogue(
          'Sir Cedric',
          'He had the gate that night, and I had the wall. I never blamed ' +
            'him. I am glad he remembers.',
        ),
        dialogue('Sir Cedric', knightLine(forgave, true)),
      )
    } else {
      lines.push(dialogue('Sir Cedric', knightLine(forgave, false)))
    }
    lines.push(
      'He looks out over the field for a while.',
      dialogue('Sir Cedric', OLD_LINE),
    )
    return lines.join('\n')
  }
}
