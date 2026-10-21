import { Item, type GameState, event } from '@/engine'
import { SharpKnife } from './SharpKnife'
import { Snare } from './Snare'
import { refreshRoomDescription } from '../refreshRoomDescription'
import { Stick } from './Stick'

/** Destructible environmental obstacle that converts into a resource (Stick) when overcome. */
export class Vines extends Item {
  constructor() {
    super({
      name: 'vines',
      description: 'Thick, thorny vines block a small alcove.',
    })
  }

  /**
   * Cut vines with the sharp knife, which Elior keeps: remove them from the
   * room and reveal a stick and a poacher's snare with a fox kit in it.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof SharpKnife) {
      gameState.currentRoom.removeItem(this.name)
      gameState.currentRoom.addItem(new Stick())
      gameState.currentRoom.addItem(new Snare())
      refreshRoomDescription(gameState)
      return (
        event(
          `You use the [item_name]${other.name}[/item_name] ` +
            'to cut through the ' +
            `thick [item_name]${this.name}[/item_name], clearing the way ` +
            'to a small alcove. You can see ' +
            'a sturdy [item_name]stick[/item_name] in the revealed alcove.',
        ) +
        '\n' +
        'You wipe the blade on the moss and keep it; it may yet be useful.'
      )
    }
    return super.useWith(gameState, other)
  }
}
