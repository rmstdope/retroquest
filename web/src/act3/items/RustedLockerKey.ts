import { Item, type GameState } from '@/engine'
import { Locker } from './Locker'

/** What the key looks like, and where it was found. */
const DESCRIPTION =
  'A corroded iron key from a hollow in the causeway rock, beside the ' +
  'mural. Its teeth are pitted with salt and age.'

/** A salt-corroded key that cannot open its intended lock through normal means. */
export class RustedLockerKey extends Item {
  constructor() {
    super({
      name: 'Rusted Locker Key',
      description: DESCRIPTION,
      shortName: 'key',
      canBeCarried: true,
    })
  }

  /** The current description, also for a key saved with the old text. */
  override examine(_gameState: GameState): string {
    return DESCRIPTION
  }

  /** Override pickup to emphasize the key's compromised condition. */
  override pickedUp(_gameState: GameState): string {
    return (
      "The key's teeth are ragged with corrosion; it might fit, but the " +
      'lock has long since fused.'
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
