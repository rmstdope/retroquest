import { Room } from '@/engine'
import { RustySaw } from '../items/RustySaw'
import { Merchant } from '../characters/Merchant'

/** Road to Greendale room: outbound transition toward broader world scope. */
export class RoadToGreendale extends Room {
  constructor() {
    super({
      name: 'Road to Greendale',
      description:
        'The main road leaving Willowbrook stretches beneath ancient oaks, their ' +
        'branches arching overhead like a living tunnel. The path is well-trodden, ' +
        "lined with wildflowers and scattered leaves. A merchant's cart creaks nearby, " +
        'and the air is filled with the promise of adventure and the unknown. The road ' +
        'beckons, leading onward to new lands and new stories.',
      items: [new RustySaw()],
      characters: [new Merchant()],
      exits: { west: 'VillageChapel' },
    })
  }
}
