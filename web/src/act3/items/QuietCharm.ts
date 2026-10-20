import { Item } from '@/engine'

/** A charm that maintains peaceful silence. */
export class QuietCharm extends Item {
  constructor() {
    super({
      name: 'quiet charm',
      description:
        'A small amulet carved from pale stone, inscribed with symbols ' +
        'that seem to dampen sound. It feels warm to the touch and ' +
        'emanates a sense of tranquility.',
      canBeCarried: true,
      shortName: 'charm',
    })
  }
}
