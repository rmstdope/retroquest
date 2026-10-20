import { Item, type GameState, event, characterName } from '@/engine'
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
        event(
          'You offer the [item_name]bread[/item_name] to the ' +
            `${characterName('chickens')}.`,
        ) +
        '\n' +
        'They peck at it excitedly, and in the commotion, something shiny falls ' +
        "from a rafter. It's a [item_name]small key[/item_name]!"
      )
    }
    return (
      "[failure]You can't use the [item_name]bread[/item_name] with the " +
      `[item_name]${other.name}[/item_name].[/failure]`
    )
  }
}
