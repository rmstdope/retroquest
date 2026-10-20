import { Item } from '@/engine'

/** Ambient river find that can act as a tactile focus or low-stakes collectible. */
export class SmoothStone extends Item {
  constructor() {
    super({
      name: 'smooth stone',
      description:
        "A small, flat stone polished smooth by the river's current. It fits perfectly " +
        'in your palm.',
      shortName: 'stone',
      canBeCarried: true,
    })
  }
}
