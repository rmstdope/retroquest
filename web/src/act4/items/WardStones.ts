import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED } from '../Act4StoryFlags'

/** Ancient ward stones that anchor the fortress's magical defenses. */
export class WardStones extends Item {
  constructor() {
    super({
      name: 'Ward Stones',
      description:
        'Ancient stone pillars carved with protective runes that pulse with ' +
        'dark energy. These ward stones appear to be the anchor points for ' +
        'the shadow guardians and magical barriers protecting the fortress.',
      canBeCarried: false,
    })
  }

  /** Examine the ward stones; the first look starts the guardians quest. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
    return event(
      'You examine the ward stones closely. Each stone is carved with ' +
        'ancient protective runes that pulse with dark energy. The stones appear ' +
        'to be the anchor points for the shadow guardians and magical barriers. ' +
        'A fragment has broken off from one stone, perhaps weakening the network.',
    )
  }
}
