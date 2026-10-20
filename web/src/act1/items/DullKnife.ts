import { Item } from '@/engine'

/** Dull kitchen knife item, could be sharpened for future use. */
export class DullKnife extends Item {
  constructor() {
    super({
      name: 'dull knife',
      description:
        'A small kitchen knife with a dull blade.' +
        " It won't cut much, but could be sharpened.",
      shortName: 'knife',
      canBeCarried: true,
    })
  }
}
