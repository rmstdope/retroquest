import { Item } from '@/engine'

/** Heavy, hooded cloak made for travel, offering warmth and protection from the elements. */
export class TravelCloak extends Item {
  constructor() {
    super({
      name: 'travel cloak',
      description:
        'A heavy, hooded cloak made for travel. It offers warmth and protection from ' +
        'the elements.',
      shortName: 'cloak',
      canBeCarried: true,
    })
  }
}
