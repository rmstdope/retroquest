import { Item } from '@/engine'

/** Chicken item representing a restless chicken in the environment. */
export class Chicken extends Item {
  constructor() {
    super({
      name: 'chicken',
      description: 'A live chicken. It will not keep still.',
    })
  }

  /** Answers to "chickens" too, the word the coop's description uses. */
  override otherNames(): string[] {
    return ['chickens']
  }
}
