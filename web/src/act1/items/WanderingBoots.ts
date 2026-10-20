import { Item } from '@/engine'

/** Wandering boots item that aids in travel. */
export class WanderingBoots extends Item {
  constructor() {
    super({
      name: 'wandering boots',
      description:
        'Sturdy leather boots, well-worn and comfortable. They seem to ' +
        'hum with a faint energy, eager for the road.',
      shortName: 'boots',
      canBeCarried: true,
    })
  }
}
