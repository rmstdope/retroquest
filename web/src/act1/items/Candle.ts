import { Item, type GameState, clue } from '@/engine'
import { Lantern } from './Lantern'
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

  /** The candle's look: cold or lit. */
  override descriptionFor(_gameState: GameState): string {
    return this.isLit ? Candle.LIT_DESCRIPTION : Candle.UNLIT_DESCRIPTION
  }

  /**
   * The lantern cannot light the candle: its flame is shut behind glass.
   * Once lit, the candle is simply lit.
   */
  private fromLantern(): string {
    if (this.isLit) {
      return `[failure]The [item_name]${this.name}[/item_name] is already lit.[/failure]`
    }
    return clue(
      "The flame sits behind the lantern's glass, and the candle's wick will " +
        'not reach in through it. The candle wants a flame of its own, ' +
        'struck for it.',
    )
  }

  /** Light the candle with matches to reveal a locket; say why the lantern will not; otherwise fail. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Lantern) return this.fromLantern()
    if (other instanceof Matches) {
      if (!this.isLit) {
        this.isLit = true
        gameState.currentRoom.addItem(new Locket())
        return (
          `The [item_name]${this.name}[/item_name] now casts a warm glow. ` +
          'Its light reaches the dark corner by the altar, ' +
          'and there lies a [item_name]locket[/item_name] that was previously unseen!'
        )
      }
      return `[failure]The [item_name]${this.name}[/item_name] is already lit.[/failure]`
    }
    return super.useWith(gameState, other)
  }

  /** With the matches in hand, the candle on its own is lit with them. */
  override use(gameState: GameState): string {
    const matches = gameState.inventory.find((item) => item instanceof Matches)
    return matches ? this.useWith(gameState, matches) : super.use(gameState)
  }

  /** The lantern used with the candle says why it cannot light it. */
  override answerUseFrom(_gameState: GameState, item: Item): string {
    return item instanceof Lantern ? this.fromLantern() : ''
  }
}
