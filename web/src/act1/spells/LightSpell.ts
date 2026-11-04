import { Spell, type GameState, characterName } from '@/engine'

/** Spell that produces a small sphere of light to illuminate dark places. */
export class LightSpell extends Spell {
  constructor() {
    super({
      id: 'light',
      name: 'light',
      description: `The third thing ${characterName('Mira')} showed you: how to make a light.`,
    })
  }

  /** Give a spell known in an older save the current description, which colours who taught it. */
  override refreshSavedText(): void {
    this.description = new LightSpell().description
  }

  /** Delegate the effect to the current room's light method. */
  override castSpell(gameState: GameState): string {
    const currentRoom = gameState.currentRoom
    return currentRoom.light(gameState)
  }
}
