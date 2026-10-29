import { Spell, type GameState } from '@/engine'

/** Spell that produces a small sphere of light to illuminate dark places. */
export class LightSpell extends Spell {
  constructor() {
    super({
      id: 'light',
      name: 'light',
      description: 'The third thing Mira showed you: how to make a light.',
    })
  }

  /** Delegate the effect to the current room's light method. */
  override castSpell(gameState: GameState): string {
    const currentRoom = gameState.currentRoom
    return currentRoom.light(gameState)
  }
}
