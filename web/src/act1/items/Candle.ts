import { Item, type GameState } from '@/engine'
import { Matches } from './Matches'
import { Locket } from './Locket'

/** Small light source that reveals a hidden Locket when lit with matches. */
export class Candle extends Item {
  isLit = false

  /** The candle before the matches: cold, like the priest says. */
  private static readonly UNLIT_DESCRIPTION =
    'A simple beeswax candle on the altar, its wick cold. ' +
    'It has a faint, comforting scent.'
  /** The candle once lit. */
  private static readonly LIT_DESCRIPTION =
    'The candle is lit, casting a warm, steady light.'

  constructor() {
    super({
      name: 'candle',
      description: Candle.UNLIT_DESCRIPTION,
    })
  }

  /** Give a candle from an older save the wording for whether it is lit. */
  override refreshSavedText(_gameState: GameState): void {
    this.description = this.isLit
      ? Candle.LIT_DESCRIPTION
      : Candle.UNLIT_DESCRIPTION
  }

  /** Light the candle with matches to reveal a locket, otherwise fail. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Matches) {
      if (!this.isLit) {
        this.isLit = true
        this.description = Candle.LIT_DESCRIPTION
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
