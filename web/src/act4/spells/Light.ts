import { Spell, type GameState, type Item } from '@/engine'
import { WardStone } from '../items/WardStone'
import { WardStones } from '../items/WardStones'
import { FortressGates } from '../rooms/FortressGates'

/** A spell that creates brilliant light to dispel darkness and shadow magic. */
export class Light extends Spell {
  constructor() {
    super({
      id: 'light',
      name: 'light',
      description: 'The third thing Mira showed you: how to make a light.',
    })
  }

  /** Cast light spell without a specific target. */
  override castSpell(gameState: GameState): string {
    // Every room has a light hook; rooms without a special effect answer by default
    return gameState.currentRoom.light(gameState)
  }

  /** Cast light spell on a specific item. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    const room = gameState.currentRoom
    if (room instanceof FortressGates) {
      if (targetItem instanceof WardStone) {
        return room.lightStone(gameState, targetItem)
      }
      if (targetItem instanceof WardStones) {
        return room.lightAllStones(gameState)
      }
    }
    return 'The light shows it clearly, but has no special effect.'
  }
}
