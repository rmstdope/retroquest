import { Item, type GameState } from '@/engine'
import { FLAG_ACT4_BARRIERS_DISABLED } from '../Act4StoryFlags'

/** The barrier while it stands: across the ways on, north and east. */
const BARRIER_DESCRIPTION =
  'A thin wall of violet light hangs across the ways on, north and east, ' +
  'humming in time with the ward stones. It is the only thing between you ' +
  'and the fortress.'

/** The violet wall that bars the ways on from just inside the fortress gates. */
export class Barriers extends Item {
  constructor() {
    super({
      name: 'Barriers',
      description: BARRIER_DESCRIPTION,
      canBeCarried: false,
    })
  }

  /** Examine the barriers. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
      return BARRIER_DESCRIPTION
    }
    return 'The violet wall is gone. The way on is only a way now.'
  }
}
