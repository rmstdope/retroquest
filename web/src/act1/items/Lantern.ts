import { Item, type GameState, clue } from '@/engine'
import { EliorsJournal } from './EliorsJournal'
import { FLAG_LANTERN_LIT } from '../Act1StoryFlags'

/**
 * Primary early-game light source that reveals hidden items on first use.
 * Lighting it sets `lit` and renames the item to "lantern (lit)". Once lit it
 * can be carried, and held lit it lights the dark Abandoned Shed for searching.
 */
export class Lantern extends Item {
  /**
   * Whether the lantern has been lit. Missing in saves made when the state
   * lived only in the name; see migrateLegacyState.
   */
  lit?: boolean = false

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
    return this.lit === true
  }

  /**
   * Give a save made before the `lit` field its value: a lit lantern had its
   * short name kept apart from its renamed name.
   */
  migrateLegacyState(): void {
    this.lit ??= this.shortName !== this.name
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

  /**
   * Light the lantern, raise FLAG_LANTERN_LIT and reveal the journal the
   * first time it is used.
   */
  override use(gameState: GameState): string {
    if (!this.isLit()) {
      this.lit = true
      this.name = 'lantern (lit)'
      this.shortName = 'lantern'
      gameState.setStoryFlag(FLAG_LANTERN_LIT, true)
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
