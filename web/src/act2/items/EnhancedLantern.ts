import { Item, type GameState } from '@/engine'
import {
  FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE,
  FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE,
} from '../Act2StoryFlags'
import { ForestEntrance } from '../rooms/ForestEntrance'

/** Magical lantern that reveals hidden paths and magical auras when used. */
export class EnhancedLantern extends Item {
  constructor() {
    super({
      name: 'enhanced lantern',
      shortName: 'lantern',
      description:
        'A magically enhanced lantern that burns with bright, steady light. ' +
        'The enchantment allows it to illuminate hidden paths and reveal magical ' +
        'auras that would otherwise remain invisible.',
      canBeCarried: true,
    })
  }

  /** Light the lantern; at the Forest Entrance this reveals the deeper paths. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof ForestEntrance) {
      if (!gameState.getStoryFlag(FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE)) {
        gameState.setStoryFlag(FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE, true)
        this.name = 'enhanced lantern (lit)'
        let result =
          "[event]The Enhanced Lantern's crystal core pulses with magical " +
          'energy, casting ethereal blue light that reveals hidden paths through ' +
          "the dense undergrowth. The light seems to resonate with the forest's " +
          'natural magic, illuminating safe routes and warning you away from ' +
          'dangerous areas. With this enhanced vision, you can navigate the ' +
          'forest with confidence.[/event]'

        // Check if both protective charm and enhanced lantern have been used
        if (
          gameState.getStoryFlag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE)
        ) {
          result +=
            "\n\n[success]With both the protective charm's spiritual barrier and " +
            "the enhanced lantern's magical illumination active, the forest's " +
            'deeper paths are now revealed and safe to travel. You can now ' +
            'venture deeper into the enchanted woods.[/success]'
        }

        return result
      }
      return (
        '[dim]The Enhanced Lantern continues to provide magical illumination, ' +
        'keeping the forest paths clearly visible.[/dim]'
      )
    }
    return (
      'You activate the enhanced lantern. Its magical light pierces through ' +
      'darkness and can reveal hidden passages, magical traces, and secret ' +
      'paths that ordinary light cannot illuminate.'
    )
  }
}
