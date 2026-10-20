import { Room } from '@/engine'
import { SackOfFlour } from '../items/SackOfFlour'
import { Mechanism } from '../items/Mechanism'

/** Old Mill room: weathered structure with latent mechanical mystery. */
export class OldMill extends Room {
  constructor() {
    super({
      name: 'Old Mill',
      description:
        'A creaky windmill towers above, its sails turning slowly in the breeze. Dusty ' +
        'gears and cobwebs fill the interior, and the scent of flour hangs in the air. ' +
        'Sunlight streams through broken windows, illuminating sacks of grain and a ' +
        'heavy millstone. Amidst the old workings, you notice a strange mechanism ' +
        "with levers and gears that doesn't quite seem to belong to the mill's " +
        'original design.',
      items: [new SackOfFlour(), new Mechanism()],
      characters: [],
      exits: { north: 'AbandonedShed', east: 'Riverbank' },
    })
  }
}
