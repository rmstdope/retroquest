import { Item, type GameState, event } from '@/engine'
import { VaultDoor } from './VaultDoor'

/**
 * Elior's heirloom, carried from the first turn of Act IV. It is the key to
 * the sealed door in the Memory Vault (see VaultDoor); alone it only shows the picture Act III left in it.
 */
export class AncientAmulet extends Item {
  constructor() {
    super({
      name: 'ancient amulet',
      shortName: 'amulet',
      description:
        'A family heirloom whose runes glint like dew at dawn. In its depths ' +
        'Aren and Lysa stand hand in hand. The third figure keeps his back ' +
        'turned.',
      canBeCarried: true,
    })
  }

  /** The amulet's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }

  /** Used with the Memory Vault's sealed door, it opens it (once the Shadow is answered). */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof VaultDoor) return other.openWith(gameState)
    return super.useWith(gameState, other)
  }
}
