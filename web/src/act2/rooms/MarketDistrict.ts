import { Room } from '@/engine'
import { MasterMerchantAldric } from '../characters/MasterMerchantAldric'
import { CaravanMasterThorne } from '../characters/CaravanMasterThorne'
import { ForestSurvivalKit } from '../items/ForestSurvivalKit'
import { EnhancedLantern } from '../items/EnhancedLantern'
import { QualityRope } from '../items/QualityRope'

/** Market District room: commerce hub supplying preparation gear (Act II). */
export class MarketDistrict extends Room {
  constructor() {
    super({
      name: 'Market District',
      description:
        'Narrow streets crammed with shops and trading posts weave a maze of commerce. ' +
        'Spices, leather, and fresh bread scent the air. Merchant wagons clog passageways ' +
        'while deals are argued in several languages. Serious business gets done here.',
      items: [],
      characters: [new MasterMerchantAldric(), new CaravanMasterThorne()],
      exits: {
        west: 'MainSquare',
        north: 'SilverStagInn',
        south: 'MerchantsWarehouse',
      },
    })
  }

  /**
   * Populate the market's display wares as non-carriable placeholders.
   *
   * A future purchase would toggle each item's `canBeCarried` to true.
   */
  addWares(): void {
    const survivalKit = new ForestSurvivalKit()
    survivalKit.canBeCarried = false
    const enhancedLantern = new EnhancedLantern()
    enhancedLantern.canBeCarried = false
    const qualityRope = new QualityRope()
    qualityRope.canBeCarried = false
    this.items = [survivalKit, enhancedLantern, qualityRope]
  }
}
