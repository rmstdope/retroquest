import { Item, type GameState, event } from '@/engine'
import { Well } from './Well'

/** Early utility container for combining items with environmental features. */
export class Bucket extends Item {
  constructor() {
    super({
      name: 'bucket',
      description:
        "A sturdy wooden bucket with a rope handle. It's perfect for drawing water " +
        'from a well or carrying supplies.',
      canBeCarried: true,
    })
  }

  /** Use bucket with well to fill it with murky or, once purified, clear water. */
  override useWith(_gameState: GameState, other: Item): string {
    if (other instanceof Well) {
      if (this.name === 'bucket') {
        this.name = 'bucket (full)'
        const water = other.isPurified
          ? 'clear water'
          : 'murky water, with a sour smell'
        this.description =
          `A sturdy wooden bucket with a rope handle. It is full of ${water} ` +
          'drawn from the well.'
        return event(
          'You lower the [item_name]bucket[/item_name] into the ' +
            `[item_name]well[/item_name] and draw it up, full of ${water}.`,
        )
      }
      return '[failure]The [item_name]bucket[/item_name] is already full.[/failure]'
    }
    return (
      "[failure]You can't seem to use the [item_name]bucket[/item_name] together " +
      `with [item_name]${other.name}[/item_name]. Perhaps near something ` +
      'with water?[/failure]'
    )
  }
}
