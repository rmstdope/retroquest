import { Item, type GameState } from '@/engine'
import { FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE } from '../Act2StoryFlags'
import { ForestEntrance } from '../rooms/ForestEntrance'
import { OfferingAltar } from './OfferingAltar'

/** The charm's description; `Act2.afterLoad` restores it in older saves. */
export const PROTECTIVE_CHARM_DESCRIPTION =
  "A twist of braided grass, bark and a bird's bone: the hermit's mark. It " +
  "tells the forest you are under the hermit's protection."

/** The hermit's mark: it opens the sprites' path at the forest entrance. */
export class ProtectiveCharm extends Item {
  constructor() {
    super({
      name: 'protective charm',
      shortName: 'charm',
      description: PROTECTIVE_CHARM_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** Opens the sprites' path at the forest entrance; elsewhere it is only braided grass. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof ForestEntrance) {
      if (!gameState.getStoryFlag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE)) {
        gameState.setStoryFlag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE, true)
        const result =
          'You hold up the charm. The sprites crowd round it, chiming, and ' +
          'settle on your sleeve one by one, then lift off again.'
        return (
          result +
          '\n\n[success]The sprites draw aside. The path south, to the ' +
          '[room_name]Ancient Grove[/room_name], is now open.[/success]'
        )
      }
      return (
        "[failure]The protective charm's energy still surrounds you, providing continued " +
        'spiritual protection in this mystical place.[/failure]'
      )
    }
    return 'The braided grass is dry and light in your hand.'
  }

  /** Use the protective charm with another item. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof OfferingAltar) {
      // Delegate to the offering altar's useWith method
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
