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
        '[dim]You need to be in The Silver Stag Inn to use the key ' +
        'with the door.[/dim]'
      )
    }
    const otherName = other.name
    return (
      "[failure]You can't use the [item_name]" +
      `${this.name}[/item_name] with the [item_name]${otherName}[/item_name].` +
      '[/failure]'
    )
  }
}
