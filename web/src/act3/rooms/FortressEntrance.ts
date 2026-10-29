import { Room } from '@/engine'
import { FortressGates } from '../items/FortressGates'

/**
 * A bastion of black stone on a shattered ridge, its gates shut behind iron lattices; the
 * Warden sigil shows through at the arch, because it was the Wardens' hall
 * before it was Malakar's fortress.
 */
export class FortressEntrance extends Room {
  constructor() {
    super({
      name: "Entrance to Malakar's Fortress",
      description:
        'A bastion of black stone rises from a shattered ridge. Iron lattices ' +
        'close its gates, and sigils glow behind them, slow as breathing. The ' +
        'wind up here is cold and smells of metal. Where the gate arch meets ' +
        'the wall an older carving shows through the black: a sun rising over ' +
        'three linked rings.',
      items: [new FortressGates()],
      characters: [],
      exits: {},
    })
  }
}
