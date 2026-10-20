import { Item } from '@/engine'

/**
 * The loaf grandmother bakes for Elior's road once Mira has taught him.
 * It counts as food for the journey, like any other kind.
 */
export class FreshBread extends Item {
  constructor() {
    super({
      name: 'fresh bread',
      shortName: 'bread',
      description:
        'A round loaf, still warm from the oven and wrapped in a clean cloth. ' +
        'It smells of home.',
      canBeCarried: true,
    })
  }
}
