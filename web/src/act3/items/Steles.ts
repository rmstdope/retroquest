import { Item, event, type GameState } from '@/engine'

/** Ancient stone pillars at the shore's edge with ward sigils; source of Moon Rune shards. */
export class Steles extends Item {
  constructor() {
    super({
      name: 'Steles',
      description:
        "Weathered stone pillars at the surf's edge. Faint moon sigils are " +
        'traced beneath coral crust, their lines worn by tide and wind.',
      shortName: 'steles',
      canBeCarried: false,
    })
  }

  /** Override pickup prevention with context-specific message. */
  override preventPickup(): string {
    return (
      "[failure]You can't take the [item_name]Steles[/item_name]. They are part " +
      'of the shore itself—heavy and set.[/failure]'
    )
  }

  /** Override examine with detailed description of the steles and fragments. */
  override examine(_gameState: GameState): string {
    return event(
      'The steles bear shallow moon-marks, pores packed with salt. ' +
        'Loose pale fragments glint in crevices—likely usable in sigil work.',
    )
  }
}
