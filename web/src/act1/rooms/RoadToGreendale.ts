import { characterName, Room } from '@/engine'
import { RustySaw } from '../items/RustySaw'
import { Merchant } from '../characters/Merchant'

/** Road to Greendale room: outbound transition toward broader world scope. */
export class RoadToGreendale extends Room {
  constructor() {
    super({
      name: 'Road to Greendale',
      description:
        'The main road out of Willowbrook runs east under old oaks, their ' +
        'branches meeting overhead. The way is well trodden, lined with ' +
        `wildflowers and fallen leaves. A ${characterName('merchant')}'s cart stands at the roadside, ` +
        'and his thin grey mare grazes beside it on three good shoes.',
      items: [new RustySaw()],
      characters: [new Merchant()],
      exits: { west: 'VillageChapel' },
    })
  }
}
