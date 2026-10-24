import { Item, type GameState } from '@/engine'

/**
 * The grey-ink marks the stranger left on the map: the inn circled twice and a
 * cross marked *cellar?* in the Residential Quarter. Shared by `use` and
 * `examine` so both always read the same.
 */
const STRANGERS_MARKS =
  'Someone has been over it in grey ink, in a small, careful hand. ' +
  '[room_name]The Silver Stag Inn[/room_name] is circled twice. ' +
  'In the Residential Quarter, at the end of one lane, a cross has been ' +
  'drawn, and beside it a single word: [italic]cellar?[/italic]'

/**
 * A portable map of Greendale. Reading it is optional: it carries the
 * grey-cloaked stranger's marks, gates nothing and is never used up.
 */
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

  /** Study the map: the layout and the stranger's marks; the map stays in the bag. */
  override use(_gameState: GameState): string {
    return (
      "The city map's detailed layout shows the Main Square at the " +
      'center, with the Market District to the east, Castle Approach to the north, ' +
      `and various other important locations clearly marked. ${STRANGERS_MARKS}`
    )
  }

  /** Describe the cartographer's work and the stranger's marks. */
  override examine(_gameState: GameState): string {
    return (
      "The city map is a professional cartographer's work, " +
      'showing detailed street layouts, building locations, and district boundaries. ' +
      STRANGERS_MARKS
    )
  }
}
