import { Item, type GameState } from '@/engine'
import { SupplyCrate } from './SupplyCrate'

/** A sturdy iron key used by the mine overseer. */
export class MinersKey extends Item {
  constructor() {
    super({
      name: "Miner's Key",
      description:
        'A heavy iron key, pitted with age, used to open the supply crates.',
      shortName: 'key',
      canBeCarried: true,
    })
  }

  /** Delegate to SupplyCrate's useWith if used with a SupplyCrate. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof SupplyCrate) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
