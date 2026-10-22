/**
 * The rules and texts shared by the three endings of Act IV: which endings
 * the virtue record colours, which ending has been played, and the parents'
 * farewell. Kept as plain functions over the game state so the wound, the
 * spell, Malakar and King Alden can all read the same answer without
 * importing one another.
 */
import { dialogue, type GameState } from '@/engine'
import {
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
  FLAG_ACT4_THRONE_BARGAIN_SEEN,
  VIRTUE_SELFLESS,
  VIRTUE_TRUTH,
} from './Act4StoryFlags'

/**
 * How many truthful (or unselfish) moments add a line to Justice (or
 * Sacrifice). No ending is ever closed by the virtue record; it only
 * colours the text.
 */
export const MOMENTS_FOR_EXTRA_LINE = 2

/** King Alden's extra line in Justice, or null below two truth moments. */
export function truthLine(gameState: GameState): string | null {
  if (gameState.virtueCount(VIRTUE_TRUTH) < MOMENTS_FOR_EXTRA_LINE) return null
  return dialogue(
    'King Alden',
    'You named every crime and did not add one. Only someone who has paid ' +
      'for the truth before speaks it like that. I will remember it.',
  )
}

/** Aren's extra line in the Sacrifice farewell, or null below two moments. */
export function selflessLine(gameState: GameState): string | null {
  if (gameState.virtueCount(VIRTUE_SELFLESS) < MOMENTS_FOR_EXTRA_LINE) {
    return null
  }
  return dialogue(
    'Aren',
    'We watched you give, again and again, and never ask for anything ' +
      'back. Today was only the last time.',
  )
}

/** The three endings. */
export type Ending = 'redemption' | 'justice' | 'sacrifice'

/** The ending that has been played, or null while the wound is open. */
export function endingPlayed(gameState: GameState): Ending | null {
  if (gameState.getStoryFlag(FLAG_ACT4_REDEMPTION_ENDING)) return 'redemption'
  if (gameState.getStoryFlag(FLAG_ACT4_JUSTICE_ENDING)) return 'justice'
  if (gameState.getStoryFlag(FLAG_ACT4_SACRIFICE_ENDING)) return 'sacrifice'
  return null
}

/** The line the ending adds to the farewell. */
const ENDING_LINES: Record<Ending, string> = {
  redemption: dialogue(
    'Lysa',
    'You gave him back to us, our friend. We never dared hope for that.',
  ),
  justice: dialogue(
    'Aren',
    'You named what he did, and you did not hate him for it. That is the ' +
      'hardest kind of fair.',
  ),
  sacrifice: dialogue(
    'Lysa',
    'You gave our gift back to close what he opened, and kept the one ' +
      'thing that was yours. That was always the best of you.',
  ),
}

/**
 * The parents' farewell, the same in every ending but for one line (and,
 * in Sacrifice, Aren's extra line after two selfless moments; Lysa adds one
 * line when the Bargain was seen).
 */
export function farewell(ending: Ending, gameState: GameState): string {
  return [
    'Where the wound was, the light of the amulet gathers into two shapes ' +
      "you have only ever seen in the vault's memories: a man with your " +
      "eyes, and a woman with Grandmother's smile. Your parents.",
    dialogue('Aren', 'Elior. Look at you. Taller than me, I think.'),
    dialogue(
      'Lysa',
      'We watched over you all this time, from inside the light. We could ' +
        'not hold you, but we could hold the door shut.',
    ),
    gameState.getStoryFlag(FLAG_ACT4_THRONE_BARGAIN_SEEN)
      ? dialogue(
          'Lysa',
          'We saw you at the workbench with us, for a moment. You let it ' +
            'go. That was the bravest thing you did today.',
        )
      : null,
    ENDING_LINES[ending],
    ...(ending === 'sacrifice' ? [selflessLine(gameState)] : []),
    dialogue(
      'Aren',
      'The ward is finished, and so are we. Tell your grandmother we are ' +
        'proud of her. Tell her we are resting.',
    ),
    dialogue('Lysa', 'Go home, love. The field is waiting.'),
    'The light thins. They smile, and they are gone. The amulet in your ' +
      'hand is only a locket now, warm and quiet. Your parents are at rest.',
  ]
    .filter((line) => line !== null)
    .join('\n')
}

/** The last line of every ending's answer: the way home opens. */
export const ARCH_LINE =
  'Behind the throne an arch you had not noticed stands open. Beyond it, ' +
  'far off, the road runs home.'

/** The sentence that ends each after-the-ending description of the chamber. */
export const ARCH_SENTENCE =
  'Behind the throne an arch stands open on the road home.'

/** The line that opens the Act IV complete page, by ending. */
export const ENDING_HOOKS: Record<Ending, string> = {
  redemption: 'Malakar is himself again. And Elior is home.',
  justice:
    'Malakar is sealed away, and the kingdom is set right. Elior is home.',
  sacrifice:
    "Elior gave his parents' gift away and kept the one spell that was his. " +
    'He is home.',
}
