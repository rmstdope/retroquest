import { Item, type GameState } from '@/engine'

/** The Hall of Echoes' banners: scenery that Truth Sight sees through. */
export class Banners extends Item {
  constructor() {
    super({
      name: 'Banners',
      description:
        'Tattered banners hang high along the walls, too grimed with age to ' +
        'read. Something is stitched beneath the dirt.',
      canBeCarried: false,
    })
  }

  /** Also answers to "banner". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'banner'
  }

  /** Examine the banners. */
  override examine(_gameState: GameState): string {
    return this.description
  }
}
