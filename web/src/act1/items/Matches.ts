import { Item, type GameState, characterName, speech } from '@/engine'
import { Candle } from './Candle'

/** Basic ignition source enabling illumination and ritual flavor actions. */
export class Matches extends Item {
  constructor() {
    super({
      name: 'matches',
      description:
        'A small box of matches. Useful for lighting fires, candles, or lanterns.',
    })
  }

  /** Shopkeeper prevents taking the matches unless they've been purchased. */
  override preventPickup(): string {
    if (!this.canBeCarried) {
      return (
        characterName('Shopkeeper') +
        ' quickly steps over. ' +
        speech(
          'Hold on there, friend! That ' +
            `[item_name]${this.name}[/item_name] is merchandise, not a free sample. ` +
            "If you want it, you'll need to buy it proper-like.",
        )
      )
    }
    return ''
  }

  /** Delegate to Candle's useWith if applicable, otherwise fallback. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Candle) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
