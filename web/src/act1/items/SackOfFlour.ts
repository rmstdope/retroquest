import { Item } from '@/engine'

/** Everyday provisioning good emphasizing agrarian economy and baking culture. */
export class SackOfFlour extends Item {
  constructor() {
    super({
      name: 'sack of flour',
      description:
        'A heavy burlap sack of fine white flour. It leaves a pale dust on your ' +
        'sleeve.',
      shortName: 'flour',
    })
  }
}
