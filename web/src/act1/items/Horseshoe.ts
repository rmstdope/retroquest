import { Item } from '@/engine'

/**
 * A bent iron horseshoe from the forge. The merchant on the Road to Greendale
 * takes it for the wandering boots when Elior keeps his mother's ring.
 */
export class Horseshoe extends Item {
  constructor() {
    super({
      name: 'horseshoe',
      description:
        'A heavy iron horseshoe, slightly bent. It might bring luck or be useful for ' +
        'repairs.',
      canBeCarried: true,
    })
  }
}
