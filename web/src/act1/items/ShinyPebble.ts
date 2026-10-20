import { Item } from '@/engine'

/** Minor collectible pebble that glints; currently flavor-only. */
export class ShinyPebble extends Item {
  constructor() {
    super({
      name: 'shiny pebble',
      description:
        'A small, smooth pebble that glints in the sunlight. It feels oddly ' +
        'warm to the touch.',
      shortName: 'pebble',
      canBeCarried: true,
    })
  }
}
