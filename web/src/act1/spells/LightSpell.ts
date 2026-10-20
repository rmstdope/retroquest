import { Spell, type GameState } from '@/engine'

/** Spell that produces a small sphere of light to illuminate dark places. */
export class LightSpell extends Spell {
  constructor() {
    super({
      name: 'light',
      description:
        'A simple spell that conjures a sphere of light to illuminate dark areas.',
    })
  }

  /** Delegate the effect to the current room's light method. */
  override castSpell(gameState: GameState): string {
    const currentRoom = gameState.currentRoom
    return currentRoom.light(gameState)
  }
}
