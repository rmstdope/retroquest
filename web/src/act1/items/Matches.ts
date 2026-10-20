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

  /** Shopkeeper prevents taking the store's matches, which are kept for the priest. */
  override preventPickup(): string {
    if (!this.canBeCarried) {
      return (
        characterName('Shopkeeper') +
        ' quickly steps over. ' +
        speech(
          'Hold on there, friend! Those ' +
            `[item_name]${this.name}[/item_name] are set aside for the ${characterName('priest')}. ` +
            'He gets them on the house whenever he asks.',
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
