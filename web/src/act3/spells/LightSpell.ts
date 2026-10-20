import { Spell, event, type GameState, type Item } from '@/engine'
import { LanternBracket } from '../items/LanternBracket'

/** A steady kindling that coaxes prisms to life. */
export class LightSpell extends Spell {
  constructor() {
    super({
      id: 'light',
      name: 'light',
      description: 'A steady kindling that coaxes prisms to life.',
    })
  }

  /** Cast light spell, checking for room-specific lighting effects. */
  override castSpell(gameState: GameState): string {
    const room = gameState.currentRoom
    const hook = (room as { castLightHere?: (gs: GameState) => string })
      .castLightHere
    if (typeof hook === 'function') {
      return hook.call(room, gameState)
    }
    return event(
      'A warm spark flares in your palm and fades—nothing here seems to ' +
        'catch.',
    )
  }

  /**
   * Cast the spell on a specific item by delegating to the base class.
   *
   * Most items do not react specially, so the base implementation handles
   * generic behavior. A lantern bracket triggers the room-level lighting
   * behavior (same as casting the spell normally).
   */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    if (targetItem instanceof LanternBracket) {
      return this.castSpell(gameState)
    }
    return super.castOnItem(gameState, targetItem)
  }
}
