import { Item, event, type GameState } from '@/engine'
import { PrismLantern } from './PrismLantern'
import { RustedLockerKey } from './RustedLockerKey'

/**
 * Corroded pier locker containing prism lanterns (Act III). Requires external
 * unlocking (spell or effect); once unlocked, opening spawns lantern items.
 */
export class Locker extends Item {
  locked = true
  opened = false
  /** Whether a rusted key has been forced into the lock and stuck. */
  rustedKeyStuck = false

  constructor() {
    super({
      name: 'Locker',
      description:
        'A corroded locker wedged under the pier. Salt and time have fused ' +
        'its lock, resisting ordinary keys and brute effort.',
      shortName: 'locker',
      canBeCarried: false,
    })
  }

  /** Return state-dependent description of the locker. */
  override examine(_gameState: GameState): string {
    if (this.opened) {
      return (
        'The door hangs open and the interior is still and cold, silt motes ' +
        'drifting inside.'
      )
    }
    if (this.locked) {
      return (
        'Barnacles crust the seam; the fused lock will not yield to a ' +
        'mundane key.'
      )
    }
    return 'The mechanism is freed; the door can be opened.'
  }

  /** Open the locker, spawning prism lanterns if newly opened. */
  override open(gameState: GameState): string {
    if (this.opened) {
      return '[dim]The locker is already open.[/dim]'
    }
    if (this.locked) {
      return (
        '[failure]You pull at the handle, but the fused lock holds tight. ' +
        'It cannot open while it remains locked.[/failure]'
      )
    }
    this.opened = true
    for (let i = 0; i < 3; i++) {
      gameState.currentRoom.items.push(new PrismLantern())
    }
    return (
      '[success]With a brittle crack the door gives, revealing three prism lanterns ' +
      'gleaming behind veils of silt.[/success]'
    )
  }

  /** Free the fused mechanism, allowing the locker to be opened. */
  unlock(_gameState: GameState): string {
    if (!this.locked) {
      return '[dim]The mechanism is already free.[/dim]'
    }

    // Unlocking the fused mechanism requires that a rusted key has been
    // forced into the lock first (it provides purchase on the corroded
    // pins). If the rusted key is not stuck, the mechanism cannot be freed
    // by ordinary means.
    if (!this.rustedKeyStuck) {
      return (
        '[failure]The lock is fused tight; without something lodged in the ' +
        'mechanism you cannot free the pins.[/failure]'
      )
    }

    // Proceed to free the mechanism when the rusted key is present.
    this.locked = false
    return (
      '[event]A subtle click echoes under the pier as fused pins release. ' +
      'The locker can now be opened.[/event]'
    )
  }

  /**
   * Handle being used together with another item. The RustedLockerKey cannot
   * open the fused lock, but gets stuck if forced, altering the locker state.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof RustedLockerKey) {
      // The rusted key gets stuck and does not unlock the mechanism.
      this.rustedKeyStuck = true
      gameState.removeItemFromInventory(other.name)
      return event(
        'The lock is too corroded for the key to turn. As you tug, ' +
          'the corroded key jams in the mechanism and will not come free.',
      )
    }
    return super.useWith(gameState, other)
  }
}
