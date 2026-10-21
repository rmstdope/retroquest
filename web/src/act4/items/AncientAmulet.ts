import { Item, type GameState, event } from '@/engine'

/**
 * Elior's heirloom, carried from the first turn of Act IV. It is the key to
 * the sealed door in the Memory Vault (see VaultDoor); alone it only glows.
 */
export class AncientAmulet extends Item {
  constructor() {
    super({
      name: 'ancient amulet',
      shortName: 'amulet',
      description:
        'A family heirloom whose runes glint like dew at dawn. It is warm in ' +
        'your hand, as it always is.',
      canBeCarried: true,
    })
  }

  /** The amulet's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }
}
