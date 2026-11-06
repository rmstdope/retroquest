import { Item, type GameState } from '@/engine'

/** Minor collectible pebble that glints; currently flavor-only. */
export class ShinyPebble extends Item {
  constructor() {
    super({
      name: 'shiny pebble',
      description:
        'A small, smooth pebble that glints faintly, as if it kept a light ' +
        'of its own. It feels oddly warm to the touch.',
      shortName: 'pebble',
      canBeCarried: true,
    })
  }

  /** Give a pebble from an older save the current wording. */
  override refreshSavedText(_gameState: GameState): void {
    this.description = new ShinyPebble().description
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is warm, warmer than the sun could make it. ' + 'You keep it anyway.'
    )
  }
}
