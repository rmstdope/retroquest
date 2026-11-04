import { Item, type GameState } from '@/engine'

/** Minor collectible pebble that glints; currently flavor-only. */
export class ShinyPebble extends Item {
  constructor() {
    super({
      name: 'shiny pebble',
      description:
        'A small, smooth pebble that glints in the sunlight. It feels oddly ' +
        'warm to the touch.',
      shortName: 'pebble',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is warm, warmer than the sun could make it. ' + 'You keep it anyway.'
    )
  }
}
