import { Room } from '@/engine'
import { CityNoticeBoard } from '../items/CityNoticeBoard'
import { MerchantsFlyer } from '../items/MerchantsFlyer'
import { TownCrier } from '../characters/TownCrier'

/**
 * Main Square room: central urban hub in Greendale (Act II). North, east and
 * south are open from the moment the player arrives; the city map is optional.
 */
export class MainSquare extends Room {
  constructor() {
    super({
      name: 'Main Square',
      description:
        'The heart of Greendale pulses with activity. A grand fountain shows ancient ' +
        'heroes locked in battle with mythical beasts. Merchants hawk wares from ' +
        'bright stalls while townsfolk bustle about, exchanging news and gossip. Stone ' +
        'buildings with red roofs frame the space. Castle towers rise to the north, and ' +
        'the energetic flow of people makes it clear important things happen here.',
      items: [new CityNoticeBoard(), new MerchantsFlyer()],
      characters: [new TownCrier()],
      exits: {
        south: 'GreendaleGates',
        north: 'CastleApproach',
        east: 'MarketDistrict',
      },
    })
  }
}
