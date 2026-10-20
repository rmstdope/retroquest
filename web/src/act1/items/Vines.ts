import { Item, type GameState } from '@/engine'
import { SharpKnife } from './SharpKnife'
import { Stick } from './Stick'

/** Destructible environmental obstacle that converts into a resource (Stick) when overcome. */
export class Vines extends Item {
  constructor() {
    super({
      name: 'vines',
      description: 'Thick, thorny vines block a small alcove.',
    })
  }

  /** Cut vines with SharpKnife, remove from room, spawn Stick, destroy knife. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof SharpKnife) {
      gameState.currentRoom.removeItem(this.name)
      gameState.removeItemFromInventory(other.name)
      gameState.currentRoom.addItem(new Stick())
      return (
        `[event]You use the [item_name]${other.name}[/item_name] ` +
        'to cut through the ' +
        `thick [item_name]${this.name}[/item_name], clearing the way ` +
        'to a small alcove. ' +
        `The [item_name]${other.name}[/item_name] shatters from the ` +
        'effort! You can see ' +
        'a sturdy [item_name]stick[/item_name] in the revealed alcove.[/event]'
      )
    }
    return super.useWith(gameState, other)
  }
}
