import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
} from '@/engine'
import { EntryPass } from '../items/EntryPass'

/** Entry authority who validates `EntryPass` and leaves the gate area once it is shown. */
export class GateCaptain extends Character {
  entryPassGiven = false

  constructor() {
    super({
      name: 'gate captain',
      description:
        "A seasoned officer of Greendale's guard, wearing polished mail and " +
        'bearing the insignia of the city watch. His weathered face shows years ' +
        'of experience maintaining order at the gates.',
    })
  }

  /**
   * Ask for entry papers. Once the pass was shown he has normally left; only
   * an older save can still have him here, and then he bids farewell and goes.
   */
  override talkTo(gameState: GameState): string {
    if (!this.entryPassGiven) {
      return (
        'The ' +
        characterName('Gate Captain') +
        ' looks at you with a professional but guarded expression. ' +
        speech(
          "'State your business in Greendale, traveler. Do you have proper " +
            "documentation for entry?'",
        )
      )
    } else {
      if (this.leaveRoom(gameState)) {
        return (
          'The ' +
          characterName('Gate Captain') +
          ' nods respectfully. ' +
          speech(
            "'Welcome to Greendale, honored visitor. You'll need a map to " +
              'navigate the city - the streets can be quite maze-like for ' +
              'newcomers. Travelers leave all sorts at the information post by ' +
              "the arch; have a look there before you go in.'",
          ) +
          ' With that, he salutes smartly and walks back to his patrol ' +
          'duties, leaving you free to explore the gate area.'
        )
      } else {
        return (
          'The Gate Captain has already returned to his duties and is ' +
          'no longer present.'
        )
      }
    }
  }

  /** Walk out of the current room; false when he was not in it. */
  private leaveRoom(gameState: GameState): boolean {
    const characters = gameState.currentRoom.characters
    const index = characters.indexOf(this)
    if (index === -1) {
      return false
    }
    characters.splice(index, 1)
    return true
  }

  /**
   * Accept the entry pass, point the player to the information post and walk
   * away in the same turn; politely decline any other item.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof EntryPass) {
      if (this.entryPassGiven) {
        const name = this.name
        return (
          'You have already shown the entry pass to the ' +
          characterName(name) +
          '. He waves you through with respect.'
        )
      }

      this.entryPassGiven = true
      this.leaveRoom(gameState)

      return (
        'The ' +
        characterName('Gate Captain') +
        ' examines the entry pass carefully when you show it to him, ' +
        'noting the official seal. His expression changes to one of ' +
        'respect as he recognizes the authority behind it. ' +
        speech(
          "'This is legitimate documentation indeed. You are welcome in " +
            "Greendale, honored visitor. Please, proceed with our blessing.'",
        ) +
        ' ' +
        speech(
          "'You'll need a map to navigate the city - the streets can be " +
            'quite maze-like for newcomers. Travelers leave things at the ' +
            'information post there; look around and you may find what you ' +
            "need.'",
        ) +
        ' With that, he salutes smartly and walks back to his patrol ' +
        'duties, leaving you free to explore the gate area.'
      )
    }

    return (
      'The ' +
      characterName('Gate Captain') +
      ` politely declines the ${item.name}. ` +
      speech("'I only need to see proper entry documentation.'")
    )
  }
}
