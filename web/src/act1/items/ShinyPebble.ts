import { Item, type GameState } from '@/engine'

const PEBBLE_DESCRIPTION =
  'A small, smooth pebble that glints faintly, as if it kept a light ' +
  'of its own. It feels oddly warm to the touch.'

/** Minor collectible pebble that glints; currently flavor-only. */
export class ShinyPebble extends Item {
  constructor() {
    super({
      name: 'shiny pebble',
      description: PEBBLE_DESCRIPTION,
      shortName: 'pebble',
      canBeCarried: true,
    })
  }

  /** The pebble's look: always the current wording, even for an older save. */
  override descriptionFor(_gameState: GameState): string {
    return PEBBLE_DESCRIPTION
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is warm, warmer than the sun could make it. ' + 'You keep it anyway.'
    )
  }
}
