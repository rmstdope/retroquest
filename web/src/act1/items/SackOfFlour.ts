import { Item } from '@/engine'

/** Everyday provisioning good emphasizing agrarian economy and baking culture. */
export class SackOfFlour extends Item {
  constructor() {
    super({
      name: 'sack of flour',
      description:
        'A heavy burlap sack filled with fine white flour. Essential for baking, but a ' +
        'bit unwieldy to carry.',
      shortName: 'flour',
    })
  }
}
