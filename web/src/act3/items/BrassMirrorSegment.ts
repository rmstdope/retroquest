import { Item, type GameState } from '@/engine'
import { MirrorMount } from './MirrorMount'

/** A curved brass segment for reassembling the mirror channel. */
export class BrassMirrorSegment extends Item {
  constructor() {
    super({
      name: 'Brass Mirror Segment',
      description:
        'A battered brass segment whose face still catches light. It looks ' +
        'fragile but usable when bound into the mirror mounts.',
      shortName: 'mirror segment',
      canBeCarried: true,
    })
  }

  /** Allow using the brass segment with mounts by delegating to the mount. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof MirrorMount) {
      // Delegate to the mount; pass this segment as the other item
      return other.useWith(gameState, this)
    }

    return super.useWith(gameState, other)
  }
}
