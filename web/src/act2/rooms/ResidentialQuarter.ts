import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { LocalCraftsmen } from '../characters/LocalCraftsmen'
import { Families } from '../characters/Families'
import { FLAG_ANCIENT_LIBRARY_ACCEPTED } from '../Act2StoryFlags'
import { HiddenLibrary } from './HiddenLibrary'

/** Residential Quarter room for Act II; handles hidden library discovery. */
export class ResidentialQuarter extends Room {
  constructor() {
    super({
      name: 'Residential Quarter',
      description:
        'Quiet streets lined with comfortable two-story homes, each with small gardens ' +
        'and neat workshops. Smoke rises from chimneys, and the sound of craftsmen at ' +
        "work echoes from nearby buildings. This is where Greendale's skilled artisans " +
        'and middle-class citizens live and work. The atmosphere is peaceful and ' +
        'industrious.',
      items: [],
      characters: [new LocalCraftsmen(), new Families()],
      exits: { south: 'CastleCourtyard', north: 'HealersHouse' },
    })
  }

  /** Handle searching for the Hidden Library entrance. */
  override search(gameState: GameState): string {
    // Get the Hidden Library room name for the message
    const hiddenLibrary = new HiddenLibrary()
    if (!gameState.getStoryFlag(FLAG_ANCIENT_LIBRARY_ACCEPTED)) {
      gameState.setStoryFlag(FLAG_ANCIENT_LIBRARY_ACCEPTED, true)
      // Add the secret passage exit when the library is discovered
      this.exits.secret_passage = 'HiddenLibrary'
      return (
        '[success]You search through the basement areas of the residential buildings. ' +
        'Behind some old storage crates and forgotten furniture, you discover a ' +
        'concealed entrance in the stone wall. A narrow tunnel leads underground to ' +
        'what appears to ' +
        "be an ancient chamber. You've found a secret passage to a " +
        `[room_name]${hiddenLibrary.name}[/room_name]! ` +
        "Use 'go secret_passage' to enter this mysterious repository.[/success]"
      )
    }
    return (
      "[dim]You've already discovered the secret passage to the " +
      `${hiddenLibrary.name}.[/dim]`
    )
  }
}
