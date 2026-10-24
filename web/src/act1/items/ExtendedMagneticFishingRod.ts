import { Item, type GameState } from '@/engine'
import { Well } from './Well'
import { ShinyRing } from './ShinyRing'
import { RuneToken } from './RuneToken'
import { FLAG_FOUND_RUNE_TOKEN } from '../Act1StoryFlags'

/**
 * Fishing rod with a magnet, used to retrieve metallic items from a distance.
 * From the purified well it draws up the shiny ring and, with it, the
 * stranger's rune token.
 */
export class ExtendedMagneticFishingRod extends Item {
  constructor() {
    super({
      name: 'extended magnetic fishing rod',
      description:
        'A long fishing rod with a magnet on the end, reinforced with a sturdy stick. ' +
        'Perfect for reaching and retrieving metallic items from a distance.',
    })
  }

  /** Use the rod with the purified well to retrieve the ring and the rune token, otherwise fail. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Well) {
      if (other.isPurified && other.containsRing) {
        const index = gameState.inventory.indexOf(this)
        if (index >= 0) gameState.inventory.splice(index, 1)
        const ring = new ShinyRing()
        const token = new RuneToken()
        gameState.inventory.push(ring, token)
        other.containsRing = false
        gameState.setStoryFlag(FLAG_FOUND_RUNE_TOKEN, true)
        return (
          'After some careful maneuvering, you manage to retrieve a ' +
          `[item_name]${ring.name}[/item_name]!\n` +
          'Something else clings to the magnet beside it: a ' +
          `[item_name]${token.name}[/item_name] of black iron, ` +
          'scored with a twisted rune. ' +
          'It is cold, far colder than the water it came from. ' +
          'Wells do not grow things like this. Someone put it there.'
        )
      } else if (!other.isPurified) {
        return (
          `The water in the [item_name]${other.name}[/item_name] ` +
          "is too murky. You can't see anything to retrieve."
        )
      } else if (!other.containsRing) {
        return (
          `You can see the bottom of the [item_name]${other.name}[/item_name] ` +
          "clearly, but there's nothing metallic to retrieve with the " +
          `[item_name]${this.name}[/item_name].`
        )
      }
      return (
        `You try to use the [item_name]${this.name}[/item_name] ` +
        `with the [item_name]${other.name}[/item_name], but ` +
        "it doesn't seem to work right now."
      )
    }
    return super.useWith(gameState, other)
  }
}
