import { Item, type GameState } from '@/engine'
import { FallenRock } from './FallenRock'

/** Strong hemp straps for securing braces and debris. */
export class SupportStraps extends Item {
  constructor() {
    super({
      name: 'Support Straps',
      description: 'Strong hemp straps for binding braces and hauling debris.',
      shortName: 'straps',
      canBeCarried: true,
    })
  }

  /** Handle using support straps with other items. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof FallenRock) {
      return other.useWith(gameState, this)
    }
    return `[failure]You can't use the Support Straps with ${other.name}.[/failure]`
  }
}
