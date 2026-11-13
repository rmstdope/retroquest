import { Item, type GameState } from '@/engine'
import { OfferingAltar } from './OfferingAltar'

/** The charm's description; `descriptionFor` returns it in older saves. */
export const NATURES_CHARM_DESCRIPTION =
  'A small wooden charm, dark with handling, carved with a sword laid ' +
  "across a branch. Sir Cedric's family has kept it since the knights first " +
  'made pacts with the forest spirits.'

/** One of the sacred charms required for the Offering Altar ritual. */
export class NaturesCharm extends Item {
  constructor() {
    super({
      name: "nature's charm",
      description: NATURES_CHARM_DESCRIPTION,
    })
  }

  /** The look: the class's own wording, so an older save reads the current text. */
  override descriptionFor(): string {
    return NATURES_CHARM_DESCRIPTION
  }

  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof OfferingAltar) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
