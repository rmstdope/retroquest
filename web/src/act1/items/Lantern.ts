import { Item, type GameState, clue } from '@/engine'
import { EliorsJournal } from './EliorsJournal'

/**
 * Primary early-game light source that reveals hidden items on first use.
 * State is tracked by renaming the item to "lantern (lit)". Once lit it can
 * be carried, and held lit it lights the dark Abandoned Shed for searching.
 */
export class Lantern extends Item {
  constructor() {
    super({
      name: 'lantern',
      description:
        'A well-used brass lantern. Its glass is clean and the wick is fresh, ready to ' +
        'light up the darkest corners.',
      canBeCarried: true,
    })
  }

  /** Whether the lantern has been lit. */
  isLit(): boolean {
    return this.name !== 'lantern'
  }

  /**
   * The lantern can be taken once it is lit, and only then; this ignores
   * `canBeCarried`, which is false in saves made while it was fixed in the
   * cottage.
   */
  override preventPickup(): string {
    if (this.isLit()) return ''
    return clue(
      `You'd rather light the [item_name]${this.name}[/item_name] ` +
        'before you carry it anywhere; it is no use to you dark.',
    )
  }

  /** Light the lantern and reveal the journal the first time it is used. */
  override use(gameState: GameState): string {
    if (!this.isLit()) {
      this.name = 'lantern (lit)'
      this.shortName = 'lantern'
      gameState.currentRoom.addItem(new EliorsJournal())
      return (
        'The flickering light reveals more of the room. A ' +
        '[item_name]journal[/item_name] appears in the light.'
      )
    }
    return `[failure]The [item_name]${this.name}[/item_name] is already lit.[/failure]`
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'The brass is worn smooth where hands have held it. ' +
      'It has lit your way home for as long as you can remember.'
    )
  }
}
