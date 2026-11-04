import { Item, type GameState } from '@/engine'

/** Collectible flower from a secluded area, hinting at mystical undercurrents. */
export class RareFlower extends Item {
  constructor() {
    super({
      name: 'rare flower',
      description:
        'A delicate, radiant flower found only in this hidden glade. ' +
        'Its petals shimmer with a faint magical glow.',
      shortName: 'flower',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'The petals stay open in your hand. ' +
      'You hold it carefully, the way you would hold something that trusted you.'
    )
  }
}
