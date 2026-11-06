import { Item, type GameState } from '@/engine'

/** Derelict digging tool hinting at future repair or crafting systems. */
export class BrokenShovel extends Item {
  constructor() {
    super({
      name: 'broken shovel',
      description:
        'A shovel with a cracked wooden handle and rust on the blade. ' +
        'It has leaned against that wall a long time.',
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
