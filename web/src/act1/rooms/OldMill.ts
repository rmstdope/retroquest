import { Room, type GameState } from '@/engine'
import { SackOfFlour } from '../items/SackOfFlour'
import { Mechanism } from '../items/Mechanism'

const DESCRIPTION_START =
  'A creaky windmill towers above, its sails turning slowly in the breeze. Dusty ' +
  'gears and cobwebs fill the interior, and the scent of flour hangs in the air. ' +
  'Sunlight streams through broken windows, illuminating sacks of grain and a ' +
  'heavy millstone.'
const MECHANISM_WORKING =
  ' Amidst the old workings, you notice a strange mechanism of black iron, ' +
  "whirring to itself, that doesn't belong to the mill's original design."
const MECHANISM_JAMMED =
  ' Amidst the old workings, the black-iron mechanism stands ' +
  'jammed with a rope, silent at last.'

/**
 * Old Mill room: a weathered mill on an old seat of power, where the cloaked
 * stranger's mechanism whirs until Elior jams it.
 *
 * The description follows the Mechanism item. `Mechanism.useWith` calls
 * `refreshDescription()` so the room text changes the moment it is jammed.
 */
export class OldMill extends Room {
  constructor() {
    super({
      name: 'Old Mill',
      description: DESCRIPTION_START + MECHANISM_WORKING,
      items: [new SackOfFlour(), new Mechanism()],
      characters: [],
      exits: { north: 'AbandonedShed', east: 'Riverbank' },
    })
  }

  /** Describe the mechanism as whirring or jammed. */
  refreshDescription(): void {
    const jammed = this.items.some(
      (item) => item instanceof Mechanism && item.repaired,
    )
    this.description =
      DESCRIPTION_START + (jammed ? MECHANISM_JAMMED : MECHANISM_WORKING)
  }

  /** Refresh the mechanism in the description before describing the room. */
  override describe(gameState: GameState): string {
    this.refreshDescription()
    return super.describe(gameState)
  }
}
