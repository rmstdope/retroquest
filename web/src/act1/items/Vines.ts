import { Item, type GameState, clue } from '@/engine'
import { DullKnife } from './DullKnife'
import { RustySaw } from './RustySaw'
import { SharpKnife } from './SharpKnife'
import { Scenery } from './Scenery'
import { Snare } from './Snare'
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
      Scenery.ensure(gameState.currentRoom, 'ForestPath', 'cut')
      return (
        `The thick [item_name]${this.name}[/item_name] fall away under the ` +
        `[item_name]${other.name}[/item_name], clearing the way ` +
        'to a small alcove. You can see ' +
        'a sturdy [item_name]stick[/item_name] in the revealed alcove.\n' +
        'You wipe the blade on the moss and keep it; it may yet be useful.'
      )
    }
    return super.useWith(gameState, other)
  }

  /**
   * The near misses: the rusty saw sticks in the thorns and the dull knife
   * only bruises them, which points at a keen edge.
   */
  override answerUseFrom(_gameState: GameState, item: Item): string {
    if (item instanceof RustySaw) {
      return clue(
        'The rusty teeth catch in the thorns and stick. ' +
          'These vines are tougher than they look, and the saw would break ' +
          'before they did. A keen edge might part them.',
      )
    }
    if (item instanceof DullKnife) {
      return clue(
        'The dull blade only bruises the vines. It would need an edge first.',
      )
    }
    return ''
  }
}
