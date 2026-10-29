import { Item } from '@/engine'

/** The cottage hearth: fixed scenery that the room description names. */
export class Hearth extends Item {
  constructor() {
    super({
      name: 'hearth',
      description:
        'A fire burns low in the stone hearth, ' +
        'and the bricks above it are black from many winters.',
      canBeCarried: false,
    })
  }
}
