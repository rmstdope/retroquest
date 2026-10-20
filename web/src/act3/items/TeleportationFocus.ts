import { Item, type GameState } from '@/engine'

/** Anchor focus for long-range circle magic; non-carriable ritual prism. */
export class TeleportationFocus extends Item {
  constructor() {
    super({
      name: 'teleportation focus',
      shortName: 'focus',
      description:
        "A crystal prism that hums faintly near Mira's spellwork. Facets " +
        'catch stray motes of light and fold them inward, anchoring safe ' +
        'circles across distant thresholds.',
      canBeCarried: false,
    })
  }

  /** Return a descriptive examination of the focus. */
  override examine(_gameState: GameState): string {
    return (
      '[event]You study the prism. Reflections hover a breath out of sync—each ' +
      "a doorway waiting for Mira's word.[/event]"
    )
  }

  /** Prevent pickup, reminding the player of its ritual function. */
  override preventPickup(): string {
    return (
      '[character_name]Mira[/character_name] steadies the prism. ' +
      "[dialogue]'Careful. The circle anchors through this focus. I must bear " +
      "it while the weave stays open.'[/dialogue]"
    )
  }
}
