import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { TravelersJournal } from '../items/TravelersJournal'
import { Coins } from '../items/Coins'

/** Hint appended to the description while the journal is still hidden. */
const FLOORBOARD_HINT =
  'One floorboard beside the bed sits a little proud of the rest.'

/** Replaces the hint once the journal has been found. */
const FLOORBOARD_AFTER =
  'The loose floorboard beside the bed sits back in its place, the hiding ' +
  'place beneath it empty.'

/**
 * Inn Rooms room: private upstairs chambers with hidden journal and coin stash.
 *
 * `search()` spawns the TravelersJournal once (`journalFound`).
 */
export class InnRooms extends Room {
  journalFound = false

  constructor() {
    super({
      name: 'Inn Rooms',
      description:
        'Comfortable guest rooms on the upper floor of The Silver Stag Inn. Each room ' +
        'has a cozy bed, a writing desk, and a window overlooking the Market District. ' +
        'The rooms are clean and well-maintained, offering a peaceful retreat for ' +
        'travelers. Faint conversation drifts up from the common room below.',
      items: Array.from({ length: 20 }, () => new Coins()),
      characters: [],
      exits: { west: 'SilverStagInn' },
    })
  }

  /** The description, ending with the floorboard hint or its "after" sentence. */
  override descriptionFor(_gameState: GameState): string {
    return `${this.description} ${this.journalFound ? FLOORBOARD_AFTER : FLOORBOARD_HINT}`
  }

  /** Search for the hidden traveler's journal (idempotent). */
  override search(_gameState: GameState): string {
    if (!this.journalFound) {
      // Add the journal to the room when first searched
      const journal = new TravelersJournal()
      this.addItem(journal)
      this.journalFound = true
      return (
        'The proud board beside the bed lifts with a creak. In the dust ' +
        'beneath it lies a plain leather journal, pushed far back, where a ' +
        'guest who left without paying would not have wanted it found.'
      )
    }
    return (
      "[failure]You've already searched this room and found everything of " +
      'interest.[/failure]'
    )
  }
}
