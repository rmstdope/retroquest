import { Item, type GameState } from '@/engine'
import { Matches } from './Matches'
import { Locket } from './Locket'

/** Small light source that reveals a hidden Locket when lit with matches. */
export class Candle extends Item {
  isLit = false

  constructor() {
    super({
      name: 'candle',
      description:
        'A simple beeswax candle. It provides a warm, steady light and a faint, ' +
        'comforting scent.',
    })
  }

  /** Light the candle with matches to reveal a locket, otherwise fail. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Matches) {
      if (!this.isLit) {
        this.isLit = true
        this.description = 'The candle is lit, casting a warm, steady light.'
        gameState.currentRoom.addItem(new Locket())
        return (
          `The [item_name]${this.name}[/item_name] now casts a warm glow. ` +
          'The flickering candlelight reveals a ' +
          '[item_name]locket[/item_name] that was previously unseen!'
        )
      }
      return `[failure]The [item_name]${this.name}[/item_name] is already lit.[/failure]`
    }
    return super.useWith(gameState, other)
  }
}
