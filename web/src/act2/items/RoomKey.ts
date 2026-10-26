import { Item, type GameState } from '@/engine'
import { SilverStagInn } from '../rooms/SilverStagInn'
import { Door } from './Door'

/** Brass key unlocking a private room at The Silver Stag Inn. */
export class RoomKey extends Item {
  constructor() {
    super({
      name: 'room key',
      shortName: 'key',
      description:
        'A brass key to a private room at The Silver Stag Inn. The room provides a quiet ' +
        'space for studying and safe storage of important items.',
      canBeCarried: false,
    })
  }

  override useWith(gameState: GameState, other: Item): string {
    // Check if other is a Door
    if (other instanceof Door) {
      // Check if we're in the Silver Stag Inn
      if (gameState.currentRoom instanceof SilverStagInn) {
        // Find the room key in inventory (it should be carriable)
        const keyInInventory =
          gameState.inventory.find((item) => item instanceof RoomKey) ?? null
        if (keyInInventory === null) {
          return (
            "[failure]You don't have a [item_name]room key[/item_name] in your " +
            'inventory.[/failure]'
          )
        }
        // Call the room's useKey method to unlock the east exit
        const result = gameState.currentRoom.useKey()
        // Remove the key from inventory after successful use
        if (result.includes('[success]')) {
          gameState.inventory.splice(
            gameState.inventory.indexOf(keyInInventory),
            1,
          )
        }
        return result
      }
      return (
        '[failure]The key is cut for a door at the Silver Stag. There is no such ' +
        'door here.[/failure]'
      )
    }
    return (
      `[failure]You can't use ${this.nameInSentence()} with ` +
      `${other.nameInSentence()}.[/failure]`
    )
  }
}
