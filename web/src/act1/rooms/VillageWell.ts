import { Room, type GameState } from '@/engine'
import { Well } from '../items/Well'

const DESCRIPTION_START =
  "An old stone well stands at the village's center, its stones worn smooth " +
  'by countless hands.'
const DESCRIPTION_END =
  ' Moss creeps up the sides. The well seems to whisper secrets to those who ' +
  'listen closely.'
const MURKY_WATER =
  ' The water below lies dark and still, and a faint sour smell hangs in the ' +
  'cool, damp air.'
const CLEAR_WATER =
  ' The water below glimmers with a crystalline clarity, and the air is cool ' +
  'and damp.'

/**
 * Village Well room: mystical utility hub foreshadowing purification systems.
 *
 * The description follows the Well item: dark and foul until it is purified,
 * crystal clear afterwards. `Well.purify` calls `refreshDescription()` so the
 * room text changes the moment the well is purified.
 */
export class VillageWell extends Room {
  constructor() {
    super({
      name: 'Village Well',
      description: DESCRIPTION_START + MURKY_WATER + DESCRIPTION_END,
      items: [new Well()],
      characters: [],
      exits: {
        west: 'VegetableField',
        east: 'BlacksmithsForge',
        south: 'AbandonedShed',
      },
    })
  }

  /** Describe the water as murky or clear depending on whether the well is purified. */
  refreshDescription(): void {
    const purified = this.items.some(
      (item) => item instanceof Well && item.isPurified,
    )
    this.description =
      DESCRIPTION_START +
      (purified ? CLEAR_WATER : MURKY_WATER) +
      DESCRIPTION_END
  }

  /** Refresh the water in the description before describing the room. */
  override describe(gameState: GameState): string {
    this.refreshDescription()
    return super.describe(gameState)
  }
}
