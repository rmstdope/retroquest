import { Item, type GameState } from '@/engine'

/** A salt-pitted coin from an older sea economy; collectible but not used. */
export class WeatheredCoin extends Item {
  /** True once the Pier Warden has pressed the coin back into the player's hand. */
  pressed = false

  constructor() {
    super({
      name: 'Weathered Coin',
      description:
        'A small, greened coin whose face has long since been worn away. ' +
        'It might be worth something to a collector, but not here.',
      shortName: 'coin',
      canBeCarried: true,
    })
  }

  /** Remember the Pier Warden pressing it back. */
  pressedBack(): void {
    this.pressed = true
  }

  /** The coin's look: worn smooth, and after the Pier Warden refused it, his words about the toll. */
  override descriptionFor(_gameState: GameState): string {
    if (!this.pressed) return this.description
    return (
      'A small, greened coin whose face has long since been worn away. ' +
      'The Pier Warden would not take it. Toll for the crossing, his da said.'
    )
  }
}
