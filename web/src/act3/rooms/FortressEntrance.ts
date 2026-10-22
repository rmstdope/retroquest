import { Room } from '@/engine'
import { FortressGates } from '../items/FortressGates'

/**
 * A blackstone bastion rising from a shattered ridge with gate sigils; the
 * Warden sigil shows through at the arch, because it was the Wardens' hall
 * before it was Malakar's fortress.
 */
export class FortressEntrance extends Room {
  constructor() {
    super({
      name: "Entrance to Malakar's Fortress",
      description:
        'A blackstone bastion rises from a shattered ridge; gate sigils pulse ' +
        'like a heartbeat behind iron lattices. The air tastes of cold metal and ' +
        'distant thunder. The massive gates loom ahead, wreathed in shadow and ' +
        'bound with eldritch wards. Where the gate arch meets the wall an older ' +
        'carving shows through the black: a sun rising over three linked rings.',
      items: [new FortressGates()],
      characters: [],
      exits: {},
    })
  }
}
