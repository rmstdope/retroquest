import { Item, event, type GameState } from '@/engine'
import { Locker } from './Locker'

/** A salt-corroded key that cannot open its intended lock through normal means. */
export class RustedLockerKey extends Item {
  constructor() {
    super({
      name: 'Rusted Locker Key',
      description:
        'A corroded iron key recovered from the pier vaults. Its teeth are ' +
        'pitted with salt and age.',
      shortName: 'key',
      canBeCarried: true,
    })
  }

  /** Override pickup to emphasize the key's compromised condition. */
  override pickedUp(_gameState: GameState): string {
    return event(
      'Its teeth are ragged with corrosion; it might fit, but the lock ' +
        'has long since fused.',
    )
  }

  /** Delegate to the locker so it can decide how to respond to the rusted key. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Locker) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
