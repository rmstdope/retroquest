import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { CityNoticeBoard } from '../items/CityNoticeBoard'
import { MerchantsFlyer } from '../items/MerchantsFlyer'
import { TownCrier } from '../characters/TownCrier'

/**
 * Main Square room: central urban hub in Greendale (Act II).
 *
 * Exits are gated until the player uses the city map; `enableCityNavigation()`
 * flips `cityMapUsed` allowing full movement. `Game.move()` reads the static
 * `exits` and the `used_city_map` flag for the "lost in the streets" message.
 */
export class MainSquare extends Room {
  cityMapUsed = false

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

  /** Return exits, limiting movement to south until the city map has been used. */
  override getExits(_gameState: GameState): Exits {
    if (this.cityMapUsed) {
      return this.exits
    }
    return { south: 'GreendaleGates' }
  }

  /** Enable the full exit set once the player has oriented using the city map. */
  enableCityNavigation(): void {
    this.cityMapUsed = true
  }
}
