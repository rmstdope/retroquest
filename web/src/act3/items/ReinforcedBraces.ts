import { Item, type GameState } from '@/engine'
import { FallenRock } from './FallenRock'

/** Heavy iron braces for stabilizing collapsed tunnels. */
export class ReinforcedBraces extends Item {
  constructor() {
    super({
      name: 'Reinforced Braces',
      description: 'Heavy iron braces used to shore up unstable rock walls.',
      shortName: 'braces',
      canBeCarried: true,
    })
  }

  /** Handle using reinforced braces with other items. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof FallenRock) {
      // Delegate to FallenRock's useWith method
      return other.useWith(gameState, this)
    }
    return (
      "[failure]You can't use the reinforced braces with the " +
      `${other.name}.[/failure]`
    )
  }
}
