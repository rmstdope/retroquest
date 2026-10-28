import {
  Character,
  characterName,
  dialogue,
  event,
  type GameState,
} from '@/engine'
import { FLAG_WOKE_FROM_DREAM } from '../Act1StoryFlags'

/**
 * The voice in the dream the game opens with: the tall figure whispering
 * Elior's name. Answering it, by talking to it or saying anything to it,
 * makes it say the three words ("…and let them rest…") and his
 * name once more, and Elior wakes in his cottage with the tune still going
 * out by the hearth. It never speaks again; it stays in the dream.
 */
export class DreamVoice extends Character {
  constructor() {
    super({
      name: 'voice',
      description:
        'It has no face you can find, only a height and a nearness. When it ' +
        'speaks, it speaks your name.',
    })
  }

  /** The figure, the shadow and the voice are one. */
  override answersTo(name: string): boolean {
    const wanted = name.toLowerCase().replace(/^the /, '')
    return ['voice', 'figure', 'shadow', 'stranger', 'man'].includes(wanted)
  }

  /** Answering the voice ends the dream (see `wake`). */
  override talkTo(gameState: GameState): string {
    return (
      'You answer it. You do not know with what: your own name back, or ' +
      'the question under it.\n\n' +
      this.wake(gameState)
    )
  }

  /** Anything said into the dream is an answer, and ends it (see `wake`). */
  override sayTo(gameState: GameState, words: string): string {
    return `You say it into the dark: ${words}.\n\n` + this.wake(gameState)
  }

  /**
   * The whisper says the three words and his name, spoken as the voice's
   * own line so the narration reads it in that voice, and Elior wakes in
   * Elior's Cottage. The cottage is entered as a move enters it, the dream
   * is taken off the map, and FLAG_WOKE_FROM_DREAM is set.
   */
  private wake(gameState: GameState): string {
    const cottage = gameState.allRooms.EliorsCottage
    const dream = gameState.currentRoom
    gameState.currentRoom = cottage
    cottage.onEnter(gameState)
    gameState.markVisited(cottage)
    gameState.visitedRooms = gameState.visitedRooms.filter(
      (name) => name !== dream.name,
    )
    gameState.setStoryFlag(FLAG_WOKE_FROM_DREAM, true)
    return (
      'The whisper comes once more, closer than the thunder, and this time ' +
      'there are words in it.\n' +
      dialogue(this.name, `…and let them rest… ${characterName('Elior')}.`) +
      '\n\n' +
      'The dark lets go of you, and you wake in your own bed. ' +
      'The storm is gone and there is grey ' +
      'morning in the curtains. Your heart is going hard. The tune is ' +
      'still going too, thin and near: someone is humming it, out by the ' +
      'hearth. Three words are already slipping, and you write them down ' +
      'before they can go.\n\n' +
      event(`You are in [room_name]${cottage.name}[/room_name].`)
    )
  }
}
