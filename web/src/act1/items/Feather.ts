import { Item } from '@/engine'

/** Lightweight byproduct item used for flavor and simple crafting. */
export class Feather extends Item {
  constructor() {
    super({
      name: 'feather',
      description:
        'A soft white feather, likely from one of the chickens. It could be used for ' +
        'writing, crafting, or tickling.',
      canBeCarried: true,
    })
  }
}
