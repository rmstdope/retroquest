import { Item } from '@/engine'

/** A single feather from the Phoenix, glowing with inner warmth. */
export class PhoenixFeather extends Item {
  constructor() {
    super({
      name: 'Phoenix Feather',
      description:
        'A single feather shed by the Phoenix, warm as a heartbeat and shimmering with ' +
        'crimson and gold. It hums faintly in your hand, as if containing a spark of ' +
        'ancient wisdom.',
    })
  }
}
