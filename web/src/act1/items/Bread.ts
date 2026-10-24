import { Item, type GameState } from '@/engine'
import { Chicken } from './Chicken'
import { Key } from './Key'

/** Edible lure item used to coax chickens into dropping a hidden key. */
export class Bread extends Item {
  constructor() {
    super({
      name: 'bread',
      description:
        'A small loaf of fresh, crusty bread. It smells delicious and could restore a ' +
        'bit of energy.',
      canBeCarried: true,
    })
  }

  /** Use bread with chickens to reveal a key, otherwise fail. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Chicken) {
      gameState.removeItemFromInventory(this.name)
      gameState.currentRoom.addItem(new Key())
      return (
        'The [item_name]chickens[/item_name] peck at the ' +
        '[item_name]bread[/item_name] excitedly, and in the flapping ' +
        'commotion something shiny ' +
        "is knocked from a high rafter. It's a [item_name]small key[/item_name], " +
        'hidden up there long ago by someone who did not want it found!'
      )
    }
    return (
      "[failure]You can't use the [item_name]bread[/item_name] with the " +
      `[item_name]${other.name}[/item_name].[/failure]`
    )
  }
}
