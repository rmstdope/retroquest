import { Item } from '@/engine'

/** A salt-pitted coin from an older sea economy; collectible but not used. */
export class WeatheredCoin extends Item {
  constructor() {
    super({
      name: 'Weathered Coin',
      description:
        'A small, greened coin whose face has long since been worn away. ' +
        'It might be worth something to a collector, but not here.',
      shortName: 'coin',
      canBeCarried: true,
    })
  }
}
