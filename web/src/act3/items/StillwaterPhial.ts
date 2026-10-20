import { Item } from '@/engine'

/** A vial of eerily still water from the vestibule pools. */
export class StillwaterPhial extends Item {
  constructor() {
    super({
      name: 'stillwater phial',
      description:
        'A crystal vial containing water so still it seems solid. The ' +
        "liquid captures and holds reflections that shouldn't be there.",
      canBeCarried: true,
      shortName: 'phial',
    })
  }
}
