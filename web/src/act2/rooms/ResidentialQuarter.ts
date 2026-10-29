import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { LocalCraftsmen } from '../characters/LocalCraftsmen'
import { Families } from '../characters/Families'
import { FLAG_ANCIENT_LIBRARY_ACCEPTED } from '../Act2StoryFlags'
import { HiddenLibrary } from './HiddenLibrary'

/** Hint appended to the description while the passage is still hidden. */
const CELLAR_HINT =
  'At the end of one lane an old cellar door has been bricked up, and a cold ' +
  'draught breathes through the gaps.'

/** Replaces the hint once the secret passage has been found. */
const CELLAR_AFTER =
  'At the end of one lane, where the cellar door was bricked up, the way down ' +
  'to the hidden library stands open.'

/** The Residential Quarter description; `Act2.afterLoad` restores it on older saves. */
export const RESIDENTIAL_QUARTER_DESCRIPTION =
  'Quiet lanes of two-storey houses, each with a small garden and a ' +
  'workshop. Craftsmen work at benches in the open doorways, and neighbours ' +
  'sit on their steps. Half the garden plots have gone grey.'

/** Residential Quarter room for Act II; handles hidden library discovery. */
export class ResidentialQuarter extends Room {
  constructor() {
    super({
      name: 'Residential Quarter',
      description: RESIDENTIAL_QUARTER_DESCRIPTION,
      items: [],
      characters: [new LocalCraftsmen(), new Families()],
      exits: { south: 'CastleCourtyard', north: 'HealersHouse' },
    })
  }

  /** The description, ending with the cellar hint or its "after" sentence. */
  override descriptionFor(gameState: GameState): string {
    const found = gameState.getStoryFlag(FLAG_ANCIENT_LIBRARY_ACCEPTED)
    return `${this.description} ${found ? CELLAR_AFTER : CELLAR_HINT}`
  }

  /** Handle searching for the Hidden Library entrance. */
  override search(gameState: GameState): string {
    const hiddenLibrary = new HiddenLibrary()
    if (!gameState.getStoryFlag(FLAG_ANCIENT_LIBRARY_ACCEPTED)) {
      gameState.setStoryFlag(FLAG_ANCIENT_LIBRARY_ACCEPTED, true)
      // Add the secret passage exit when the library is discovered
      this.exits.secret_passage = 'HiddenLibrary'
      return (
        '[success]You work at the bricks of the old cellar door. The mortar is ' +
        'soft, and they come away in your hands. Behind them, steps lead down ' +
        'into the cold, to a passage under the city and a room full of ' +
        'books.[/success]'
      )
    }
    return (
      "[failure]You've already discovered the secret passage to the " +
      `${hiddenLibrary.name}.[/failure]`
    )
  }
}
