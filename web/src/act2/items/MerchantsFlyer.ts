import { Item, type GameState } from '@/engine'

/** Promotional flyer advertising Market District merchants and coupons. */
export class MerchantsFlyer extends Item {
  constructor() {
    super({
      name: "merchant's flyer",
      shortName: 'flyer',
      description:
        "A colorful handbill advertising the Market District's finest merchants " +
        'and their premium goods. It features a special introduction coupon ' +
        'for new customers seeking quality adventure gear.',
      canBeCarried: true,
    })
  }

  override use(_gameState: GameState): string {
    return (
      "The merchant's flyer advertises quality goods from Master " +
      'Merchant Aldric and would serve as a good introduction when visiting ' +
      'the Market District.'
    )
  }
}
