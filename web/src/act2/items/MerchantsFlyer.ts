import { Item, type GameState } from '@/engine'

/** What the flyer reads as when examined, also restored on load. */
export const FLYER_DESCRIPTION =
  "A handbill for Master Merchant Aldric's in the Market District: rope, " +
  'lanterns and gear for the road. At the bottom, in smaller print: ' +
  'Bring this, and be welcome.'

/** Handbill for Master Merchant Aldric's shop; handing it over opens the shop. */
export class MerchantsFlyer extends Item {
  constructor() {
    super({
      name: "merchant's flyer",
      shortName: 'flyer',
      description: FLYER_DESCRIPTION,
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
