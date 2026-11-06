import { Item, type GameState } from '@/engine'

/**
 * A bent iron horseshoe from the forge. The merchant on the Road to Greendale
 * takes it for the wandering boots when Elior keeps his mother's ring.
 */
export class Horseshoe extends Item {
  constructor() {
    super({
      name: 'horseshoe',
      description: 'A heavy iron horseshoe, bent a little at one heel.',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is heavy, and bent at one heel. ' +
      'Iron like this does not go to waste.'
    )
  }
}
