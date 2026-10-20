import { Item } from '@/engine'

/** A powerful elixir created from the three virtues that can save King Alden. */
export class LifelightElixir extends Item {
  constructor() {
    super({
      name: 'Lifelight Elixir',
      description:
        'A shimmering elixir that seems to contain liquid starlight. ' +
        'Threads of crystal clarity, phoenix flame, and draconic essence ' +
        'swirl within the glass vial. This potion pulses with the combined ' +
        'power of courage, wisdom, and selflessness—the three virtues ' +
        "needed to counter Malakar's dark ritual and save King Alden's life.",
      canBeCarried: true,
      shortName: 'elixir',
    })
  }
}
