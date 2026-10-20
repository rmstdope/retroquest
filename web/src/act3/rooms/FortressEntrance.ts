import { Room } from '@/engine'
import { FortressGates } from '../items/FortressGates'

/** A blackstone bastion rising from a shattered ridge with gate sigils. */
export class FortressEntrance extends Room {
  constructor() {
    super({
      name: "Entrance to Malakar's Fortress",
      description:
        'A blackstone bastion rises from a shattered ridge; gate sigils pulse ' +
        'like a heartbeat behind iron lattices. The air tastes of cold metal and ' +
        'distant thunder. The massive gates loom ahead, wreathed in shadow and ' +
        'bound with eldritch wards.',
      items: [new FortressGates()],
      characters: [],
      exits: {},
    })
  }
}
