import { Item, type GameState } from '@/engine'
import { MirrorMount } from './MirrorMount'

/** A viscous resin useful for securing mirror segments in mounts. */
export class BindingResin extends Item {
  constructor() {
    super({
      name: 'Binding Resin',
      description:
        'A sticky, heat-cured resin used by mirrorwrights to bind brass ' +
        'segments into place.',
      shortName: 'resin',
      canBeCarried: true,
    })
  }

  /**
   * Delegate using resin on a MirrorMount to the mount's useWith, which
   * enforces ordering and inventory rules.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof MirrorMount) {
      return other.useWith(gameState, this)
    }

    return super.useWith(gameState, other)
  }
}
