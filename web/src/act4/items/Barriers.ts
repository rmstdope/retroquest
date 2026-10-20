import { Item, type GameState } from '@/engine'
import { FLAG_ACT4_BARRIERS_DISABLED } from '../Act4StoryFlags'

/** Magical barriers of dark energy blocking the fortress entrances. */
export class Barriers extends Item {
  constructor() {
    super({
      name: 'Barriers',
      description:
        'Shimmering barriers of dark energy block the entrances to the ' +
        'fortress. The barriers pulse in rhythm with the ward stones, ' +
        'drawing power from their dark magic.',
      canBeCarried: false,
    })
  }

  /** Examine the barriers. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)) {
      return (
        '[event]Shimmering barriers of dark energy block the entrances to the ' +
        'fortress. The barriers pulse in rhythm with the ward stones, drawing ' +
        'power from their dark magic.[/event]'
      )
    }
    return (
      '[event]The magical barriers have been disabled and no longer block ' +
      'your way.[/event]'
    )
  }
}
