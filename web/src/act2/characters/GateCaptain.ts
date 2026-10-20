import { Character, type GameState, type Item } from '@/engine'
import { EntryPass } from '../items/EntryPass'

/** Entry authority who validates `EntryPass` and may leave the gate area. */
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

  /** Ask for entry papers, or bid farewell and leave once the pass was shown. */
  override talkTo(gameState: GameState): string {
    if (!this.entryPassGiven) {
      return (
        'The [character_name]Gate Captain[/character_name] looks at you with a ' +
        "professional but guarded expression. [dialogue]'State your business in " +
        "Greendale, traveler. Do you have proper documentation for entry?'[/dialogue]"
      )
    } else {
      const characters = gameState.currentRoom.characters
      const index = characters.indexOf(this)
      if (index !== -1) {
        // Remove self from the current room
        characters.splice(index, 1)
        return (
          'The [character_name]Gate Captain[/character_name] nods respectfully. ' +
          "[dialogue]'Welcome to Greendale, honored visitor. You'll need a map " +
          'to navigate the city - the streets can be quite maze-like for ' +
          'newcomers. Feel free to look around here for anything that might ' +
          "help you find your way.'[/dialogue] With that, " +
          'he salutes smartly and walks back to his patrol duties, leaving ' +
          'you free to explore the gate area.'
        )
      } else {
        return (
          'The Gate Captain has already returned to his duties and is ' +
          'no longer present.'
        )
      }
    }
  }

  /** Accept the entry pass and politely decline any other item. */
  override giveItem(_gameState: GameState, item: Item): string {
    if (item instanceof EntryPass) {
      if (this.entryPassGiven) {
        const name = this.name
        return (
          'You have already shown the entry pass to the ' +
          `[character_name]${name}[/character_name]. ` +
          'He waves you through with respect.'
        )
      }

      this.entryPassGiven = true

      return (
        'The [character_name]Gate Captain[/character_name] examines the entry pass ' +
        'carefully when you show it to him, noting the official seal. His expression ' +
        'changes to one of respect as he recognizes the authority behind it. ' +
        "[dialogue]'This is legitimate documentation indeed. You are welcome in " +
        "Greendale, honored visitor. Please, proceed with our blessing.'[/dialogue] " +
        'He steps aside and gestures toward the city.'
      )
    }

    return (
      'The [character_name]Gate Captain[/character_name] politely declines the ' +
      `${item.name}. ` +
      "[dialogue]'I only need to see proper entry documentation.'[/dialogue]"
    )
  }
}
