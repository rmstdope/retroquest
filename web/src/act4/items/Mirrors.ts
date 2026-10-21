import { Item, type GameState, event } from '@/engine'

/** The false mirrors of the Mirror Labyrinth: scenery to examine. */
export class Mirrors extends Item {
  constructor() {
    super({
      name: 'Mirrors',
      description:
        'Each mirror shows a different Elior — older, younger, crowned, ' +
        'broken — with a different corridor stretching away behind him. ' +
        'Every path looks real. Most of them are lies.',
      canBeCarried: false,
    })
  }

  /** Examine the mirrors. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }
}
