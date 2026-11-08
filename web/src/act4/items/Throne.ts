import { Item } from '@/engine'

/**
 * The throne of black stone at the head of the Throne Chamber: scenery the
 * chamber's description names, to be looked at and nothing more.
 */
export class Throne extends Item {
  constructor() {
    super({
      name: 'Throne',
      description:
        'Black stone, twisted like a root, as if it grew up through the ' +
        'floor. Nobody sits in it.',
      canBeCarried: false,
    })
  }
}
