import { Item, type GameState } from '@/engine'
import { AshFern } from './AshFern'

/** Cooled slag is granular, glassy waste usable in simple wards. */
export class CooledSlag extends Item {
  constructor() {
    super({
      name: 'cooled slag',
      description:
        'Rough, glassy fragments of slag cooled against the tunnel walls. ' +
        'When ground with ash-fern it forms a basic heat‑ward paste.',
      shortName: 'cooled slag',
      canBeCarried: true,
    })
  }

  /** Delegate to AshFern's useWith if the other item is AshFern. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof AshFern) {
      return other.useWith(gameState, this)
    }
    return (
      `[failure]You can't use the [item_name]${this.name}[/item_name] ` +
      `with the [item_name]${other.name}[/item_name].[/failure]`
    )
  }
}
