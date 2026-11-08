import { Item, type GameState, clue } from '@/engine'
import { FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED } from '../Act4StoryFlags'

/** The guardians while the barrier stands: their look follows the stones. */
const GUARDIANS_BEFORE =
  'They drift between the stones and never cross the violet wall. ' +
  'When the stones swell, the guardians thicken; when the stones fade, ' +
  'they thin with them.'

/** The guardians once the barrier has fallen. */
const GUARDIANS_AFTER =
  'The guardians are gone. Nothing drifts between the dark stones now.'

/**
 * The shadow guardians drifting between the ward stones at the Fortress
 * Gates. They stand on the barrier, so they cannot be fought or lit away;
 * their look points at the stones' rhythm, and once the right stone is lit
 * they are gone.
 */
export class Guardians extends Item {
  constructor() {
    super({
      name: 'Shadow Guardians',
      shortName: 'guardians',
      description: GUARDIANS_BEFORE,
      canBeCarried: false,
    })
  }

  /** The player may also say "guardian" or "shadow guardian". */
  override answersTo(name: string): boolean {
    const wanted = name.toLowerCase()
    return (
      super.answersTo(name) ||
      wanted === 'guardian' ||
      wanted === 'shadow guardian'
    )
  }

  /** The guardians' look: in time with the stones, then gone. */
  override examine(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)
      ? GUARDIANS_AFTER
      : GUARDIANS_BEFORE
  }

  /** Taking a guardian: the hand goes through them, and once they are gone there is nothing to take. */
  override preventPickup(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)) {
      return 'Nothing of the guardians is left to take.'
    }
    return clue(
      'Your hand passes through the nearest guardian, cold as a cellar.',
    )
  }
}
