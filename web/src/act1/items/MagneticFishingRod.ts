import { Item, type GameState, clue } from '@/engine'
import { ExtendedMagneticFishingRod } from './ExtendedMagneticFishingRod'
import { Stick } from './Stick'
import { Well } from './Well'

/** Fishing rod with a magnet, used for attracting metallic objects and crafting upgrades. */
export class MagneticFishingRod extends Item {
  constructor() {
    super({
      name: 'magnetic fishing rod',
      description:
        'A fishing rod with a magnet attached to the end. Good for attracting ' +
        'metallic objects.',
    })
  }

  /** Combine with Stick to create ExtendedMagneticFishingRod, or fail with Well. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Stick) {
      const selfIndex = gameState.inventory.indexOf(this)
      if (selfIndex >= 0) gameState.inventory.splice(selfIndex, 1)
      const otherIndex = gameState.inventory.indexOf(other)
      if (otherIndex >= 0) gameState.inventory.splice(otherIndex, 1)
      const extendedRod = new ExtendedMagneticFishingRod()
      gameState.inventory.push(extendedRod)
      return (
        `The [item_name]${other.name}[/item_name] lashes onto the ` +
        `[item_name]${this.name}[/item_name]: it is an ` +
        `[item_name]${extendedRod.name}[/item_name] now.`
      )
    }
    if (other instanceof Well) {
      return clue(
        'The [item_name]rod[/item_name] is too short to reach the water.',
      )
    }
    return super.useWith(gameState, other)
  }
}
