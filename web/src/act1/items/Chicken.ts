import { Item } from '@/engine'

/** Chicken item representing a restless chicken in the environment. */
export class Chicken extends Item {
  constructor() {
    super({
      name: 'chicken',
      description:
        'A live, clucking chicken. It seems restless and' +
        " might peck if you're not careful.",
    })
  }
}
