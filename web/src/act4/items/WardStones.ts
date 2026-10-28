import { Item, type GameState } from '@/engine'
import {
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
} from '../Act4StoryFlags'

/** The three ward stones taken together: the look that names the odd one out. */
export class WardStones extends Item {
  constructor() {
    super({
      name: 'Ward Stones',
      description:
        'Three ward stones stand inside the gates, left, middle and right.',
      canBeCarried: false,
    })
  }

  /** Examine the ward stones; before the gates fall the first look starts the guardians quest. */
  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)) {
      return (
        'Three ward stones, dark and silent. The right one is missing a ' +
        'piece of its face.'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
    return (
      'Three ward stones stand inside the gates, evenly spaced, each carved ' +
      'with the same runes. Their light swells and fades together, and the ' +
      'barrier swells and fades with them. All but one: the right stone ' +
      'brightens a breath after the others, like a man who has lost count.'
    )
  }
}
