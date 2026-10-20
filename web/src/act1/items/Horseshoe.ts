import { Item } from '@/engine'

/** Portable flavor/crafting seed item representing a bent iron horseshoe. */
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
