import { Item } from '@/engine'

/** Chicken item representing a restless chicken in the environment. */
export class Chicken extends Item {
  constructor() {
    super({
      name: 'chicken',
      description: 'A live chicken. It will not keep still.',
    })
  }
}
