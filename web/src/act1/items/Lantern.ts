import { Item, type GameState } from '@/engine'
import { Bread } from './Bread'
import { EliorsJournal } from './EliorsJournal'

/**
 * Primary early-game light source that reveals hidden items on first use.
 * State is tracked by renaming the item to "lantern (lit)".
 */
export class Lantern extends Item {
  constructor() {
    super({
      name: 'lantern',
      description:
        'A well-used brass lantern. Its glass is clean and the wick is fresh, ready to ' +
        'light up the darkest corners.',
    })
  }

  /** Light the lantern and reveal hidden items the first time it is used. */
  override use(gameState: GameState): string {
    if (this.name === 'lantern') {
      this.name = 'lantern (lit)'
      this.shortName = 'lantern'
      gameState.currentRoom.addItem(new Bread())
      gameState.currentRoom.addItem(new EliorsJournal())
      return (
        `[event]You light the [item_name]${this.name}[/item_name]. The flickering ` +
        'light reveals more of the room. A small loaf of [item_name]bread[/item_name] ' +
        'and a [item_name]journal[/item_name] appear in the light.[/event]'
      )
    }
    return `[failure]The [item_name]${this.name}[/item_name] is already lit.[/failure]`
  }
}
