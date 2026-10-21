import { Character, type GameState, dialogue, event } from '@/engine'
import { FLAG_ACT4_ELIXIR_ON_KING } from '../Act4StoryFlags'

/**
 * King Alden in the Throne Chamber: asleep in his crystal prison until the
 * Lifelight Elixir breaks it, then alive and weak, with one line to say.
 */
export class KingAlden extends Character {
  constructor() {
    super({
      name: 'King Alden',
      description:
        'The king of Eldoria, grey with the long years of the wound. His ' +
        'crown is dark.',
    })
  }

  /** Also answers to "alden" and "king". */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) || ['alden', 'king'].includes(name.toLowerCase())
    )
  }

  /** His look, which changes once the prison is broken. */
  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return event(
        'The king of Eldoria, weak and grey, but breathing. His crown is ' +
          'dark still.',
      )
    }
    return event(this.description)
  }

  /** Asleep in the crystal until it is broken; then his one line. */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return dialogue(
        'King Alden',
        'You came for me. Whoever you are, you came.',
      )
    }
    return '[dim]King Alden sleeps in the crystal and does not hear you.[/dim]'
  }
}
