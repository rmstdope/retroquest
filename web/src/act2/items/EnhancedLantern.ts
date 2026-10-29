import { Item, type GameState } from '@/engine'
import { FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE } from '../Act2StoryFlags'
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
        const result =
          "The lantern's crystal catches, and its light comes out blue and " +
          'steady. Where it falls on the undergrowth to the east, the ' +
          'tangle thins, and a narrow path shows through it.'

        return (
          result +
          '\n\n[success]A narrow path east, toward a tranquil glade, is now open.[/success]'
        )
      }
      return (
        '[failure]The enhanced lantern continues to provide magical illumination, ' +
        'keeping the forest paths clearly visible.[/failure]'
      )
    }
    return (
      'You activate the enhanced lantern. Its magical light pierces through ' +
      'darkness and can reveal hidden passages, magical traces, and secret ' +
      'paths that ordinary light cannot illuminate.'
    )
  }
}
