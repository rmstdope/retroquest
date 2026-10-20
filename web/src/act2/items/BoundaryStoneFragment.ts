import { Item } from '@/engine'

/** Weathered geomantic shard foreshadowing ward restoration mechanics (inert). */
export class BoundaryStoneFragment extends Item {
  constructor() {
    super({
      name: 'boundary stone fragment',
      description:
        'A weathered shard of carved granite etched with faint, interlocking sigils. ' +
        'The lines form geometric patterns suggestive of containment or balance, ' +
        'though erosion has obscured parts of the design. A residual tingle of ' +
        'dormant warding magic lingers in the stone.',
      shortName: 'stone fragment',
      canBeCarried: true,
    })
  }
}
