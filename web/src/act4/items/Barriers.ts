import { Item, type GameState } from '@/engine'
import { FLAG_ACT4_BARRIERS_DISABLED } from '../Act4StoryFlags'

/** Magical barriers of dark energy blocking the fortress entrances. */
export class Barriers extends Item {
  constructor() {
    super({
      name: 'Barriers',
      description:
        'A thin wall of violet light hangs across the gateway, humming in time ' +
        'with the ward stones. It is the only thing between you and the gates.',
      canBeCarried: false,
    })
  }

  /** Examine the barriers. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
      return (
        'A thin wall of violet light hangs across the gateway, humming in ' +
        'time with the ward stones. It is the only thing between you and ' +
        'the gates.'
      )
    }
    return 'The violet wall is gone. The gateway is only a gateway now.'
  }
}
