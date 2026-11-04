import { Item, type GameState } from '@/engine'

/**
 * The loaf grandmother bakes for Elior's road once Mira has taught him.
 * It counts as bread for the road. It has no short name, so `bread` always
 * means the cottage loaf the chickens want.
 */
export class FreshBread extends Item {
  constructor() {
    super({
      name: 'fresh bread',
      description:
        'A round loaf, still warm from the oven and wrapped in a clean cloth. ' +
        'It smells of home.',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is warm through the cloth. ' +
      'It smells of home, and of her kitchen.'
    )
  }
}
