import { Item, type GameState } from '@/engine'
import { FallenRock } from './FallenRock'

/** Tapered wooden blocks for prying and stabilizing rockfalls. */
export class WedgeBlocks extends Item {
  constructor() {
    super({
      name: 'Wedge Blocks',
      description:
        'Tapered wooden blocks used to pry and stabilize fallen rock.',
      shortName: 'wedges',
      canBeCarried: true,
    })
  }

  /** Handle using wedge blocks with other items. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof FallenRock) {
      // Delegate to FallenRock's useWith method
      return other.useWith(gameState, this)
    }
    return (
      "[failure]You can't use the wedge blocks with " +
      `${other.nameInSentence()}.[/failure]`
    )
  }
}
