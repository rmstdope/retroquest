import { Item } from '@/engine'

/** Valuable silver ring with gemstone, reward for solving the well puzzle. */
export class ShinyRing extends Item {
  constructor() {
    super({
      name: 'shiny ring',
      shortName: 'ring',
      description:
        'A beautiful silver ring with a small, sparkling gemstone. ' +
        'It looks quite valuable.',
      canBeCarried: true,
    })
  }
}
