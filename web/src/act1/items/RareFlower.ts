import { Item } from '@/engine'

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
}
