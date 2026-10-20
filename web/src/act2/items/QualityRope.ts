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
      "You examine the quality rope. It's well-made and versatile - useful for climbing, " +
      'rappelling, securing equipment, or any situation where strong, reliable rope ' +
      'is needed. You need to use it with something specific, like a ravine or cliff.'
    )
  }

  /** Special method for using rope with other items like the ravine. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Ravine) {
      // Check if caravan has already been secured
      if (gameState.getStoryFlag(FLAG_FOUND_LOST_CARAVAN)) {
        return (
          "[dim]You've already used your rope to secure the caravan and help the " +
          'merchants escape from the ravine.[/dim]'
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
        '[success]You secure one end of your [item_name]Quality Rope[/item_name] to a ' +
        'sturdy tree and lower it into the ravine. Rappelling down carefully, you find ' +
        'the trapped merchant caravan at the bottom. The merchants are injured but ' +
        'alive, and their wagon is damaged but some goods are salvageable. Working ' +
        'together, you create a rope system that allows everyone to climb to safety. ' +
        'The grateful merchants gather their most valuable goods and follow you back ' +
        'to civilization. The caravan has been successfully rescued![/success]'
      )
    }
    // Fallback message when rope can't be used with the provided item
    const name = other.name
    return `You can't use the rope with ${name}.`
  }
}
