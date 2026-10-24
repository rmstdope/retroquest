import { Item, type GameState } from '@/engine'
import { SilverStagInn } from '../rooms/SilverStagInn'
import { RoomKey } from './RoomKey'

/** Non-carriable door item used as an environmental barrier and interaction target. */
export class Door extends Item {
  constructor() {
    super({
      name: 'door',
      shortName: 'door',
      description:
        'A heavy wooden door reinforced with iron bands. The craftsmanship is solid ' +
        'and reliable, built to withstand the daily traffic of travelers and locals. ' +
        'It leads to the private inn rooms upstairs.',
      canBeCarried: false,
    })
  }

  /** Hint at the upstairs rooms when used inside the Silver Stag Inn. */
  override use(gameState: GameState): string {
    // Check if we're in the Silver Stag Inn
    if (gameState.currentRoom instanceof SilverStagInn) {
      return (
        "[dim]The door leads to the private inn rooms upstairs. You can 'go east' " +
        'to enter the room area.[/dim]'
      )
    }
    return '[dim]This door is not accessible from your current location.[/dim]'
  }

  /** Describe the sturdy oak door. */
  override examine(_gameState: GameState): string {
    return (
      'The door is made of sturdy oak wood with decorative iron ' +
      'hinges and a simple latch. The door frame is carved with intricate patterns ' +
      "typical of the inn's welcoming atmosphere. This door provides access to the " +
      'upper floor where guests can rent private rooms for rest and storage.'
    )
  }

  /** Handle using the door with other items. Delegates to Room Key if applicable. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof RoomKey) {
      // Delegate to the Room Key's useWith method, passing door as the target
      return other.useWith(gameState, this)
    }
    return `You can't use the door with ${other.name}.`
  }
}
