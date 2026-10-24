import { Item, type GameState } from '@/engine'
import { FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE } from '../Act2StoryFlags'
import { ForestEntrance } from '../rooms/ForestEntrance'
import { OfferingAltar } from './OfferingAltar'

/** Talisman granting spiritual protection in the enchanted forest when used. */
export class ProtectiveCharm extends Item {
  constructor() {
    super({
      name: 'protective charm',
      shortName: 'charm',
      description:
        'A small talisman woven from forest vines and blessed by ancient magic.' +
        ' It pulses with a gentle green light and carries the protective power ' +
        'of the deep woods. This charm will ward off hostile forest spirits ' +
        "and mark the bearer as one under the hermit's protection.",
      canBeCarried: true,
    })
  }

  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof ForestEntrance) {
      if (!gameState.getStoryFlag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE)) {
        gameState.setStoryFlag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE, true)
        const result =
          'The Protective Charm radiates a warm, golden light as you invoke ' +
          'its power. A shimmering barrier of spiritual energy surrounds ' +
          'you, and you feel the watchful gaze of the forest spirits become ' +
          'less threatening. The ancient magic recognizes your respect and ' +
          'preparation, granting you safe passage through these sacred woods.'
        return (
          result +
          '\n\n[success]The sprites draw aside. The path south, to the ancient grove, is now open.[/success]'
        )
      }
      return (
        "[failure]The Protective Charm's energy still surrounds you, providing continued " +
        'spiritual protection in this mystical place.[/failure]'
      )
    }
    return (
      'The [item_name]protective charm[/item_name] glows softly, providing a sense of ' +
      'comfort and protection. It seems most powerful near places of natural magic.'
    )
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
