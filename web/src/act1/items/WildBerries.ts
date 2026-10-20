import { Item } from '@/engine'

/** Foraged berries that may be edible but carry risk; currently flavor-only. */
export class WildBerries extends Item {
  constructor() {
    super({
      name: 'wild berries',
      description:
        "A handful of small, juicy berries. They look edible, but you can't be " +
        "sure they're safe.",
      shortName: 'berries',
      canBeCarried: true,
    })
  }
}
