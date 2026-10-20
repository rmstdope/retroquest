import { Item, type GameState } from '@/engine'
import { FLAG_USED_CITY_MAP } from '../Act2StoryFlags'
import { MainSquare } from '../rooms/MainSquare'

/** A portable map item that reveals city navigation when used. */
export class CityMap extends Item {
  constructor() {
    super({
      name: 'city map',
      shortName: 'map',
      description:
        'A detailed map of Greendale showing the main districts, important ' +
        'buildings, and street layouts. The map is well-drawn and clearly ' +
        'marked, making navigation through the city much easier.',
      canBeCarried: true,
    })
  }

  /** Memorize the map: flag it, enable city navigation and drop the map. */
  override use(gameState: GameState): string {
    // Set the story flag when the city map is used
    gameState.setStoryFlag(FLAG_USED_CITY_MAP, true)
    // Enable city navigation in Main Square
    const mainSquare = gameState.allRooms['MainSquare']
    if (mainSquare instanceof MainSquare) {
      mainSquare.enableCityNavigation()
    }
    // Remove the map from inventory since it's been memorized
    gameState.removeItemFromInventory('city map')
    return (
      'You study the city map carefully. The detailed layout shows the Main Square at the ' +
      'center, with the Market District to the east, Castle Approach to the north, ' +
      'and various other important locations clearly marked. You commit the layout ' +
      'to memory and no longer need to carry the physical map.'
    )
  }

  /** Describe the cartographer's work in detail. */
  override examine(_gameState: GameState): string {
    return (
      "You examine the city map closely. It's a professional cartographer's work, " +
      'showing detailed street layouts, building locations, and district boundaries. ' +
      "The map covers all of Greendale's major areas and would be invaluable for " +
      'navigation.'
    )
  }
}
