import { Item, type GameState } from '@/engine'
import { FLAG_FOUND_LOST_CARAVAN } from '../Act2StoryFlags'
import { Caravan } from './Caravan'
import { Ravine } from './Ravine'

/** Durable rope used for climbing, rescue, and utility tasks in the field. */
export class QualityRope extends Item {
  constructor() {
    super({
      name: 'quality rope',
      shortName: 'rope',
      description:
        'Fifty feet of strong, reliable rope suitable for climbing, securing loads, ' +
        'and emergency situations. The rope is treated to resist weather and ' +
        'magical corrosion.',
      canBeCarried: true,
    })
  }

  override use(_gameState: GameState): string {
    // Default behavior - rope needs to be used with something specific
    return (
      'You coil the quality rope over your arm: fifty feet of it, tight-laid, ' +
      'without a frayed strand. It wants an edge to be dropped over.'
    )
  }

  /** Special method for using rope with other items like the ravine. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Ravine) {
      // Check if caravan has already been secured
      if (gameState.getStoryFlag(FLAG_FOUND_LOST_CARAVAN)) {
        return (
          "[failure]You've already used your rope to secure the caravan and help the " +
          'merchants escape from the ravine.[/failure]'
        )
      }

      // Use the rope to rescue the caravan
      gameState.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)

      // Add the rescued caravan to the current room
      const caravan = new Caravan()
      gameState.currentRoom.items.push(caravan)

      // Remove the rope from inventory as it's used up in the rescue
      const index = gameState.inventory.findIndex(
        (item) => item instanceof QualityRope,
      )
      if (index >= 0) gameState.inventory.splice(index, 1)

      return (
        '[success]You tie the [item_name]rope[/item_name] to a sturdy ' +
        'tree and climb down into the ravine. The wagon lies on its side at ' +
        "the bottom, and round it are Thorne's people: hurt, hungry, and " +
        'alive. One by one you get them up the rope, and they bring what ' +
        'goods they can carry.[/success]'
      )
    }
    // Fallback message when rope can't be used with the provided item
    return `You can't use the rope with ${other.nameInSentence()}.`
  }
}
