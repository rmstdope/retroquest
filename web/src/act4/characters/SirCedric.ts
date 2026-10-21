import { Character, type GameState, dialogue } from '@/engine'

/** Sir Cedric leaning on the fence of Willowbrook Field, with one line. */
export class SirCedric extends Character {
  constructor() {
    super({
      name: 'Sir Cedric',
      description: 'Sir Cedric, leaning on the fence as if it were a wall.',
    })
  }

  /** Also answers to "cedric". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'cedric'
  }

  /** His one line, the same in every ending. */
  override talkTo(_gameState: GameState): string {
    return dialogue(
      'Sir Cedric',
      'I have walked a long way beside you. This is a good place to stop.',
    )
  }
}
