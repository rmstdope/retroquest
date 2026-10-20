import { Item } from '@/engine'

/**
 * The loaf grandmother bakes for Elior's road once Mira has taught him.
 * It counts as bread for the road. It has no short name, so `bread` always
 * means the cottage loaf the chickens want.
 */
export class FreshBread extends Item {
  constructor() {
    super({
      name: 'fresh bread',
      description:
        'A round loaf, still warm from the oven and wrapped in a clean cloth. ' +
        'It smells of home.',
      canBeCarried: true,
    })
  }
}
