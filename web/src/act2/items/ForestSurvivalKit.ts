import { Item, type GameState } from '@/engine'
import { FLAG_HERMITS_WARNING_COMPLETED } from '../Act2StoryFlags'
import { ForestTransition } from '../rooms/ForestTransition'

/** Comprehensive kit providing supplies and guidance for safe forest travel. */
export class ForestSurvivalKit extends Item {
  constructor() {
    super({
      name: 'forest survival kit',
      shortName: 'kit',
      description:
        'A comprehensive kit containing everything needed for safe forest exploration: ' +
        'dried food, water purification tablets, protective gear, a compass, and magical ' +
        'wards against forest spirits.',
      canBeCarried: true,
    })
  }

  /** Use the kit; in the Forest Transition it completes the hermit's warning. */
  override use(gameState: GameState): string {
    // Check if we're in Forest Transition for special handling
    const currentRoom = gameState.currentRoom
    if (currentRoom instanceof ForestTransition) {
      gameState.setStoryFlag(FLAG_HERMITS_WARNING_COMPLETED, true)

      // Remove the forest survival kit from inventory after successful use
      gameState.removeItemFromInventory('forest survival kit')

      return (
        `[success]You open the [item_name]${this.name}[/item_name] and spread its ` +
        'contents. The compass points true north, the protective gear fits snugly, ' +
        'and the dried rations remind you to prepare for a long journey. Most ' +
        'importantly, you study the forest map, learning the locations of safe ' +
        'camping spots and which areas to avoid. You feel much more prepared for ' +
        'wilderness survival and equipped yourself with the essential gear from the ' +
        'kit. You can now safely enter the forest.[/success]'
      )
    }
    // Default behavior for other rooms
    return (
      'You examine the forest survival kit. It contains high-quality gear that would ' +
      'provide essential protection and tools for navigating dangerous forest areas ' +
      'safely. Now is not the time to use it.'
    )
  }
}
