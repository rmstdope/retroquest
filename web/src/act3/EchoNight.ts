import { dialogue, event, type GameState } from '@/engine'
import { FLAG_ACT3_ECHO_HEARD } from './Act3StoryFlags'

/**
 * The echo of the night Aren, Lysa and Malakar parted, shared by the Echo
 * Chambers (`listen`) and the runic walls (a second examine). The voices are
 * tagged by kind, never named by the game.
 */

/** The short line `listen` gives once the echo has been heard. */
export const ECHO_AFTER =
  '[dim]Only your own breath comes back from the stone, and under it, ' +
  'very faintly, a door closing.[/dim]'

const ECHO_NIGHT =
  event(
    'You hold still. The whispers in the alcoves gather, and for a moment ' +
      'they are not copying you at all. Three voices, close and tired, as ' +
      'if the night they belong to never ended.',
  ) +
  '\n\n' +
  dialogue(
    "A man's voice, steady",
    'Mal. Put the lamp down and listen to me.',
  ) +
  '\n\n' +
  dialogue(
    'A second man, quick and low',
    'I have listened for a year, Aren. ' +
      'The Wasting is in Willowbrook. It is in her.',
  ) +
  '\n\n' +
  dialogue(
    "A woman's voice, hoarse",
    'Then let it stay in me. Not this. Time is not a door, Mal.',
  ) +
  '\n\n' +
  dialogue('The second man', 'It is only a door if I close it again.') +
  '\n\n' +
  dialogue(
    'The steady voice',
    'It is a wound. You know it is. Stay. Wait with us.',
  ) +
  '\n\n' +
  dialogue('The second man', 'You would have me wait while you die.') +
  '\n\n' +
  event(
    'Somewhere in the stone, a door closes. The whispers go back to ' +
      'copying your breath.',
  )

/** Whether the echo has been heard. */
export function echoHeard(gameState: GameState): boolean {
  return gameState.getStoryFlag(FLAG_ACT3_ECHO_HEARD)
}

/** Play the echo for the first time: records that it was heard and returns it. */
export function playEcho(gameState: GameState): string {
  gameState.setStoryFlag(FLAG_ACT3_ECHO_HEARD, true)
  return ECHO_NIGHT
}
