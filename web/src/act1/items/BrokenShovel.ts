import { Item, type GameState } from '@/engine'

/** Derelict digging tool hinting at future repair or crafting systems. */
export class BrokenShovel extends Item {
  constructor() {
    super({
      name: 'broken shovel',
      description:
        'A rusty, splintered shovel with a cracked wooden handle. It looks like it ' +
        "hasn't been used in years, but might still be useful for digging in soft " +
        'earth.',
      shortName: 'shovel',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'The handle shifts where it is cracked. ' +
      'It will dig, if you are gentle with it.'
    )
  }
}
