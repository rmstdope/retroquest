import { Item, type GameState, clue } from '@/engine'
import { Magnet } from './Magnet'
import { MagneticFishingRod } from './MagneticFishingRod'
import { River } from './River'
import { Well } from './Well'

/** Fishing rod tool with upgrade path to a MagneticFishingRod. */
export class FishingRod extends Item {
  constructor() {
    super({
      name: 'fishing rod',
      shortName: 'rod',
      description: 'A simple fishing rod. It looks a bit flimsy.',
      canBeCarried: true,
    })
  }

  /** Combine with Magnet if spell is learned, interact with River, or fail with Well. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Magnet) {
      if (gameState.hasSpell('purify')) {
        const selfIndex = gameState.inventory.indexOf(this)
        if (selfIndex >= 0) gameState.inventory.splice(selfIndex, 1)
        const magnetIndex = gameState.inventory.indexOf(other)
        if (magnetIndex >= 0) gameState.inventory.splice(magnetIndex, 1)

        const magneticRod = new MagneticFishingRod()
        gameState.inventory.push(magneticRod)
        return (
          `The [item_name]${other.name}[/item_name] clamps onto the end of ` +
          `the [item_name]${this.name}[/item_name]: it is a ` +
          `[item_name]${magneticRod.name}[/item_name] now.`
        )
      }
      return clue(
        'You could force the magnet onto the rod, but it would likely ' +
          'prevent you from fishing — and you are really keen on doing some ' +
          'fishing!',
      )
    }

    if (other instanceof River) {
      return other.useWith(gameState, this)
    }

    if (other instanceof Well) {
      return clue(
        'The [item_name]rod[/item_name] is too short to reach the water.',
      )
    }
    return super.useWith(gameState, other)
  }
}
