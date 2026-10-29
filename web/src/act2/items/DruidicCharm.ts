import { Item, type GameState } from '@/engine'
import { OfferingAltar } from './OfferingAltar'

/** The charm's description; `Act2.afterLoad` restores it in older saves. */
export const DRUIDIC_CHARM_DESCRIPTION =
  'A pendant of dark oak on a leather cord, bound with silver wire, with an ' +
  'oak leaf carved on its face. It hung over the door of the Silver Stag for ' +
  'longer than there has been a Silver Stag.'

/** Marcus's gift: the oak-leaf charm for the offering altar. */
export class DruidicCharm extends Item {
  constructor() {
    super({
      name: 'druidic charm',
      description: DRUIDIC_CHARM_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** The charm is only warm from the hand, in every room. */
  override use(_gameState: GameState): string {
    return 'The charm is warm from your hand.'
  }

  /** Use the druidic charm with another item. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof OfferingAltar) {
      // Delegate to the offering altar's useWith method
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
