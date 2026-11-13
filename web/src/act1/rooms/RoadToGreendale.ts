import { characterName, Room, type GameState } from '@/engine'
import { RustySaw } from '../items/RustySaw'
import { Merchant } from '../characters/Merchant'
import { Scenery } from '../items/Scenery'

const ROAD_DESCRIPTION =
  'The main road out of Willowbrook runs east under old oaks, their ' +
  'branches meeting overhead. The way is well trodden, lined with ' +
  `wildflowers and fallen leaves. A ${characterName('merchant')}'s cart stands at the roadside, ` +
  'and his thin grey mare grazes beside it on three good shoes.'

/** Road to Greendale room: outbound transition toward broader world scope. */
export class RoadToGreendale extends Room {
  constructor() {
    super({
      name: 'Road to Greendale',
      description: ROAD_DESCRIPTION,
      items: [new RustySaw(), ...Scenery.forRoom('RoadToGreendale')],
      characters: [new Merchant()],
      exits: { west: 'VillageChapel' },
    })
  }

  /** The road's look: always the current wording, even for an older save. */
  override descriptionFor(_gameState: GameState): string {
    return ROAD_DESCRIPTION
  }
}
