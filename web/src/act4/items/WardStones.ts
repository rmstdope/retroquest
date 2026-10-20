import { Item, type GameState, event } from '@/engine'

/** Ancient ward stones that anchor the fortress's magical defenses. */
export class WardStones extends Item {
  constructor() {
    super({
      name: 'Ward Stones',
      description:
        'Ancient stone pillars carved with protective runes that pulse with ' +
        'dark energy. These ward stones appear to be the anchor points for ' +
        'the shadow guardians and magical barriers protecting the fortress.',
      canBeCarried: false,
    })
  }

  /** Examine the ward stones. */
  override examine(_gameState: GameState): string {
    return event(
      'You examine the ward stones closely. Each stone is carved with ' +
        'ancient protective runes that pulse with dark energy. The stones appear ' +
        'to be the anchor points for the shadow guardians and magical barriers. ' +
        'A fragment has broken off from one stone, perhaps weakening the network.',
    )
  }
}
