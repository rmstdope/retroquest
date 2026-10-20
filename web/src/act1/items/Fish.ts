import { Item } from '@/engine'

/** A plump river fish item that can be carried. */
export class Fish extends Item {
  constructor() {
    super({
      name: 'fish',
      description:
        'A plump river fish. It looks fresh and would make a good' +
        ' meal or perhaps a gift.',
      canBeCarried: true,
    })
  }
}
