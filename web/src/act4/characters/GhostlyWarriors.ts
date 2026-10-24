import { Character, type GameState } from '@/engine'

/**
 * Ghostly warriors fighting an old battle among the banners of the Hall of
 * Echoes. Optional: Redemption's Light puts them at peace (see that spell).
 */
export class GhostlyWarriors extends Character {
  constructor() {
    super({
      name: 'Ghostly Warriors',
      description:
        'Pale shapes of soldiers drift among the banners, fighting a battle ' +
        'that ended long ago. Their blades pass through one another without ' +
        'a sound.',
    })
  }

  /** Also answers to "warriors". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'warriors'
  }

  /** The warriors' look. */
  override examine(_gameState: GameState): string {
    return this.description
  }

  /** They cannot hear Elior. */
  override talkTo(_gameState: GameState): string {
    return '[dim]The warriors do not hear you. They are still fighting.[/dim]'
  }
}
