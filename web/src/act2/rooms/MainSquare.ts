import { Room } from '@/engine'
import { CityNoticeBoard } from '../items/CityNoticeBoard'
import { MerchantsFlyer } from '../items/MerchantsFlyer'
import { TownCrier } from '../characters/TownCrier'

/** The Main Square's description; `Act2.afterLoad` restores it on older saves. */
export const MAIN_SQUARE_DESCRIPTION =
  'The heart of Greendale: a great fountain of old heroes fighting beasts, ' +
  'stalls under bright awnings, red roofs all round. The square is crowded, ' +
  'but the talk is low, and it stops when a guard walks past. Castle towers ' +
  'rise to the north.'

/**
 * Main Square room: central urban hub in Greendale (Act II). North, east and
 * south are open from the moment the player arrives; the city map is optional.
 */
export class MainSquare extends Room {
  constructor() {
    super({
      name: 'Main Square',
      description: MAIN_SQUARE_DESCRIPTION,
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
