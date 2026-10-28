import { Item } from '@/engine'

/** A single feather from the Phoenix, glowing with inner warmth. */
export class PhoenixFeather extends Item {
  constructor() {
    super({
      name: 'Phoenix Feather',
      description:
        'A single feather shed by the Phoenix, warm as a heartbeat, red at ' +
        'the quill and gold at the tip. It hums faintly in your hand.',
    })
  }
}
