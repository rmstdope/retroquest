import { Item } from '@/engine'

/** Chunk of stone broken from the old mill's grinding wheel. */
export class MillstoneFragment extends Item {
  constructor() {
    super({
      name: 'millstone fragment',
      description:
        "A chunk of stone broken from the old mill's grinding wheel. It's heavy " +
        'and rough, but could be useful for repairs or as a tool.',
      shortName: 'fragment',
      canBeCarried: true,
    })
  }
}
