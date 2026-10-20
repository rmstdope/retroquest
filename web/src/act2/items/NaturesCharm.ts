import { Item, type GameState } from '@/engine'
import { OfferingAltar } from './OfferingAltar'

/** One of the sacred charms required for the Offering Altar ritual. */
export class NaturesCharm extends Item {
  constructor() {
    super({
      name: "nature's charm",
      description:
        'An ancient charm blessed by the knights of old, carved from living wood and ' +
        'inlaid with silver runes. It pulses with a gentle green light and seems to ' +
        'resonate with the natural world. This is clearly one of the sacred charms ' +
        'mentioned in the old texts - those needed to summon the forest sprite Nyx.',
    })
  }

  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof OfferingAltar) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
