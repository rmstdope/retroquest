import { Character, type GameState, characterName, speech } from '@/engine'
import { FLAG_CEDRIKS_HONOR_COMPLETED } from '../Act2StoryFlags'

/** Ambient NPC who broadcasts civic news and points players to key hubs. */
export class TownCrier extends Character {
  constructor() {
    super({
      name: 'town crier',
      description:
        'A loud, enthusiastic man dressed in official Greendale colors who ' +
        'announces news and events throughout the city. He carries a brass ' +
        'bell and scroll with current announcements.',
    })
  }

  /**
   * Announce the Lord Commander's call for able hands and point to the notice
   * board; Cedric is named quietly until his name is cleared, then cheered.
   */
  override talkTo(gameState: GameState): string {
    const name = this.name
    const greeting =
      characterName(name) +
      ': ' +
      speech(
        'Hear ye, hear ye! Welcome to Greendale, traveler! The Lord ' +
          'Commander calls for able hands to serve the realm. Read his ' +
          'notice on the board!',
      )
    const cedric = characterName('Sir Cedric')
    if (gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)) {
      return (
        greeting +
        '\n\nHe rings his bell twice, with relish.\n\n' +
        speech(
          'And fresh news from the Great Hall! The Lord Commander has ' +
            `cleared ${cedric}'s name and given him back his sword. ` +
            `${cedric}, and no 'as was' about it!`,
        )
      )
    }
    return (
      greeting +
      '\n\nHe lowers his bell and his voice with it.\n\n' +
      speech(
        "If it's a sword arm they want of you, they'll send you to the " +
          `training yard, to ${cedric}. ${cedric}, as was. Mind your ` +
          "manners with him; whatever folk say, he's a fair man.",
      )
    )
  }
}
