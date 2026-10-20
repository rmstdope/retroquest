import { Item } from '@/engine'

/** A smooth shell polished by tides; can be picked up but has no special use. */
export class PolishedShell extends Item {
  constructor() {
    super({
      name: 'Polished Shell',
      description:
        "A small, iridescent shell smoothed by long tides. It's pretty and " +
        'shines in the moonlight.',
      shortName: 'shell',
      canBeCarried: true,
    })
  }
}
