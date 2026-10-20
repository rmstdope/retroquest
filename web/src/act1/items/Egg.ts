import { Item } from '@/engine'

/** Simple agricultural product reinforcing life in the village. */
export class Egg extends Item {
  constructor() {
    super({
      name: 'egg',
      description:
        'A freshly laid egg, still warm. It could be cooked or used in a recipe.',
      canBeCarried: true,
    })
  }
}
