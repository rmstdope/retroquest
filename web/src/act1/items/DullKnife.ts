import { Item, type GameState } from '@/engine'

/** Dull kitchen knife item, could be sharpened for future use. */
export class DullKnife extends Item {
  constructor() {
    super({
      name: 'dull knife',
      description:
        'A small kitchen knife with a dull blade.' +
        " It won't cut much, but could be sharpened.",
      shortName: 'knife',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return 'You test the edge with your thumb. ' + 'It would not cut bread.'
  }
}
