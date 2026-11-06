import { Item, type GameState, clue } from '@/engine'
import { Magnet } from './Magnet'
import { MagneticFishingRod } from './MagneticFishingRod'
import { River } from './River'
import { Stick } from './Stick'
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

  /**
   * Combine with Magnet if spell is learned, interact with River, or fail
   * with Well; the Stick goes on last, after whatever takes the rod's end.
   */
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
        'With a magnet on the line, the rod would catch iron and never a fish. ' +
          'Not yet, then.',
      )
    }

    if (other instanceof Stick) {
      return clue(
        'Lashed on now, the stick would cover the end of the rod, where ' +
          'something else may want to go first. The length can come last.',
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

  /** At the river, the rod on its own fishes it; elsewhere the generic refusal. */
  override use(gameState: GameState): string {
    const river = gameState.currentRoom.items.find(
      (item) => item instanceof River,
    )
    return river ? river.useWith(gameState, this) : super.use(gameState)
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return 'It bends more than a rod should. ' + 'It will have to do.'
  }
}
