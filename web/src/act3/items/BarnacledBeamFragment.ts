import { Item, clue } from '@/engine'

/** A splintered beam piece encrusted with barnacles; not carriable. */
export class BarnacledBeamFragment extends Item {
  constructor() {
    super({
      name: 'Barnacled Beam Fragment',
      description:
        'A jagged remnant of timber studded with barnacles. It juts from the ' +
        'pier, more anchor than object.',
      shortName: 'beam',
      canBeCarried: false,
    })
  }

  /** Explain why the fragment cannot be taken. */
  override preventPickup(): string {
    return clue(
      "The beam is fused into the pier's wreckage; you cannot pry it free." +
        '',
    )
  }
}
