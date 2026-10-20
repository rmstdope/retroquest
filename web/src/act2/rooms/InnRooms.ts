import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { TravelersJournal } from '../items/TravelersJournal'
import { Coins } from '../items/Coins'

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

  /** Search for the hidden traveler's journal (idempotent). */
  override search(_gameState: GameState): string {
    if (!this.journalFound) {
      // Add the journal to the room when first searched
      const journal = new TravelersJournal()
      this.addItem(journal)
      this.journalFound = true
      return (
        '[event]You search the inn rooms thoroughly.[/event]\n\nAs you examine the room ' +
        'carefully, you notice a wooden floorboard near the bed is slightly raised. ' +
        'Pressing it shifts the board with a soft creak. Lifting it reveals a hidden ' +
        'space containing a ' +
        'leather-bound journal deliberately concealed by a previous guest. The pages hold ' +
        'detailed notes and observations that may aid your journey.'
      )
    }
    return (
      "[event]You search the inn rooms again.[/event]\n\nYou've already searched " +
      'this room and found everything of interest.'
    )
  }
}
