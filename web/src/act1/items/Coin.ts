import { Item, type GameState, event } from '@/engine'

/** Basic currency token with a minor flavor interaction (flip action). */
export class Coin extends Item {
  constructor() {
    super({
      name: 'coin',
      description:
        'A small, circular piece of metal, likely used as currency. It has a simple ' +
        'stamp on one side.',
      shortName: 'coin',
      canBeCarried: true,
    })
  }

  /** Flip the coin for a flavor message. */
  override use(_gameState: GameState): string {
    return (
      event('You flip the [item_name]coin[/item_name] in the air.') +
      '\n' +
      'It lands heads up. Seems like a regular [item_name]coin[/item_name], ' +
      'perhaps for trading.'
    )
  }
}
