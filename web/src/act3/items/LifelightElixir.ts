import { Item } from '@/engine'

/** The elixir Mira made from the three relics, to stop what Malakar is doing to the king. */
export class LifelightElixir extends Item {
  constructor() {
    super({
      name: 'Lifelight Elixir',
      description:
        'A small glass vial the colour of first light. Something moves in ' +
        'it: a white glint, a thread of flame, a dark shimmer like a scale ' +
        'turning. Mira made it from the three relics, to stop what Malakar ' +
        'is doing to the king.',
      canBeCarried: true,
      shortName: 'elixir',
    })
  }
}
