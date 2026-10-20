import { Item, type GameState, event } from '@/engine'
import { Well } from './Well'
import { ShinyRing } from './ShinyRing'

/** Fishing rod with a magnet, used to retrieve metallic items from a distance. */
export class ExtendedMagneticFishingRod extends Item {
  constructor() {
    super({
      name: 'extended magnetic fishing rod',
      description:
        'A long fishing rod with a magnet on the end, reinforced with a sturdy stick. ' +
        'Perfect for reaching and retrieving metallic items from a distance.',
    })
  }

  /** Use the rod with the well to retrieve metallic items, otherwise fail. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Well) {
      const eventMsg =
        event(
          `You try to use the [item_name]${this.name}[/item_name] ` +
            `with the [item_name]${other.name}[/item_name].`,
        ) + '\n'
      if (other.isPurified && other.containsRing) {
        const index = gameState.inventory.indexOf(this)
        if (index >= 0) gameState.inventory.splice(index, 1)
        const ring = new ShinyRing()
        gameState.inventory.push(ring)
        other.containsRing = false
        return (
          eventMsg +
          'After some careful maneuvering, you manage to retrieve a ' +
          `[item_name]${ring.name}[/item_name]!`
        )
      } else if (!other.isPurified) {
        return (
          eventMsg +
          `The water in the [item_name]${other.name}[/item_name] ` +
          "is too murky. You can't see anything to retrieve."
        )
      } else if (!other.containsRing) {
        return (
          eventMsg +
          `You can see the bottom of the [item_name]${other.name}[/item_name] ` +
          "clearly, but there's nothing metallic to retrieve with the " +
          `[item_name]${this.name}[/item_name].`
        )
      }
      return (
        eventMsg +
        `You try to use the [item_name]${this.name}[/item_name] ` +
        `with the [item_name]${other.name}[/item_name], but ` +
        "it doesn't seem to work right now."
      )
    }
    return super.useWith(gameState, other)
  }
}
