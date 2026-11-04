import { Item, type GameState } from '@/engine'

/** Old, rusty saw with a worn wooden handle, useful for cutting soft materials. */
export class RustySaw extends Item {
  constructor() {
    super({
      name: 'rusty saw',
      description:
        'An old, rusty saw with a worn wooden handle. It looks like it could still cut ' +
        'through something soft, but might break on anything tough.',
      shortName: 'saw',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'The teeth are dull and orange with rust. ' +
      'It will cut something soft, once or twice.'
    )
  }
}
