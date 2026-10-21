/**
 * The rules and texts shared by the three endings of Act IV: which endings
 * the virtue record opens, which ending has been played, and the parents'
 * farewell. Kept as plain functions over the game state so the wound, the
 * spell, Malakar and King Alden can all read the same answer without
 * importing one another.
 */
import { dialogue, type GameState } from '@/engine'
import {
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
  VIRTUE_SELFLESS,
  VIRTUE_TRUTH,
} from './Act4StoryFlags'

/**
 * How many truthful (or unselfish) moments open Justice (or Sacrifice).
 * Act IV adds at most one truthful moment and no unselfish one yet, so
 * reaching this number always needs a moment from Acts I-III.
 */
export const MOMENTS_FOR_ENDING = 2

/** The three endings. */
export type Ending = 'redemption' | 'justice' | 'sacrifice'

/** Whether the virtue record opens Justice. */
export function justiceOpen(gameState: GameState): boolean {
  return gameState.virtueCount(VIRTUE_TRUTH) >= MOMENTS_FOR_ENDING
}

/** Whether the virtue record opens Sacrifice. */
export function sacrificeOpen(gameState: GameState): boolean {
  return gameState.virtueCount(VIRTUE_SELFLESS) >= MOMENTS_FOR_ENDING
}

/**
 * Whether Justice can be chosen once the prison is broken. The elixir only
 * breaks the prison when an ending is open; a save made before that gate
 * existed may have none, and then both roads stay open so nobody is stranded.
 */
export function justiceChoosable(gameState: GameState): boolean {
  return justiceOpen(gameState) || !sacrificeOpen(gameState)
}

/** Whether Sacrifice can be chosen once the prison is broken (see above). */
export function sacrificeChoosable(gameState: GameState): boolean {
  return sacrificeOpen(gameState) || !justiceOpen(gameState)
}

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
    'You gave it all away, and kept the smallest thing. That was always ' +
      'the best of you.',
  ),
}

/** The parents' farewell, the same in every ending but for one line. */
export function farewell(ending: Ending): string {
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
    ENDING_LINES[ending],
    dialogue(
      'Aren',
      'The ward is finished, and so are we. Tell your grandmother we are ' +
        'proud of you. Tell her we are resting.',
    ),
    dialogue('Lysa', 'Go home, love. The field is waiting.'),
    'The light thins. They smile, and they are gone. The amulet in your ' +
      'hand is only a locket now, warm and quiet. Your parents are at rest.',
  ].join('\n')
}
