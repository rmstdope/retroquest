import { Character, type GameState } from '@/engine'

/** Nyx, the small light in the hedge of Willowbrook Field. */
export class Nyx extends Character {
  constructor() {
    super({
      name: 'Nyx',
      description: 'A small light that flickers in the hedge, keeping close.',
    })
  }

  /** Nyx cannot speak; the light answers with a touch. */
  override talkTo(_gameState: GameState): string {
    return (
      'The little light brushes your cheek, warm, and settles back into ' +
      'the hedge.'
    )
  }
}
