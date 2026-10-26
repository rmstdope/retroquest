import { Room, type GameState } from '@/engine'
import { SackOfFlour } from '../items/SackOfFlour'
import { Mechanism } from '../items/Mechanism'
import {
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_STRANGER_SEEN_AT_MILL,
} from '../Act1StoryFlags'

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

/** The one paragraph in which the cloaked stranger is seen, his back turned. */
const STRANGER_SIGHTING =
  'A man in a grey cloak stands at the far door with his back to you, ' +
  'quite still, his head bent as if he were listening to the floor. You ' +
  'have made no sound, and yet he knows you are there. He does not turn. ' +
  'He steps out into the light toward the river, and when you reach the ' +
  'door the path is empty.'

const AMULET_HUM =
  ' At your side, the [item_name]ancient amulet[/item_name] hums softly, as if ' +
  'answering something stirring beneath the floor.'

/**
 * Old Mill room: a weathered mill on an old seat of power, where the cloaked
 * stranger's mechanism whirs until Elior jams it, and where the stranger
 * himself is seen once, with his back turned, after the rune token is found.
 *
 * The description follows the Mechanism item: `descriptionFor` computes it
 * from the mechanism and the amulet each time the room is shown.
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

  /**
   * The mill with its mechanism whirring or jammed; once it is jammed and
   * Elior carries the amulet, the amulet hums.
   */
  override descriptionFor(gameState: GameState): string {
    const jammed = this.items.some(
      (item) => item instanceof Mechanism && item.repaired,
    )
    return (
      DESCRIPTION_START +
      (jammed ? MECHANISM_JAMMED : MECHANISM_WORKING) +
      (jammed && gameState.hasItem('Ancient Amulet') ? AMULET_HUM : '')
    )
  }

  /**
   * The first time Elior walks in after the rune token has come up from the
   * well, the cloaked stranger is seen once, with his back turned, and
   * leaves without turning. Only a move shows it, never `look` or a load.
   */
  override enterText(gameState: GameState): string {
    if (
      !gameState.getStoryFlag(FLAG_FOUND_RUNE_TOKEN) ||
      gameState.getStoryFlag(FLAG_STRANGER_SEEN_AT_MILL)
    ) {
      return ''
    }
    gameState.setStoryFlag(FLAG_STRANGER_SEEN_AT_MILL, true)
    return STRANGER_SIGHTING
  }
}
