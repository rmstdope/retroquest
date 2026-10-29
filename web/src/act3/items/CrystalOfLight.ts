import { Item, clue, type GameState } from '@/engine'
import {
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
} from '../Act3StoryFlags'

/**
 * Central luminous relic binding multiple quest prerequisites (Act III).
 * Pickup reversal enforces completion gating; on success sets the acquisition flag.
 */
export class CrystalOfLight extends Item {
  constructor() {
    super({
      name: 'Crystal of Light',
      shortName: 'Crystal',
      description:
        'A prism the size of your palm, cold and clear. ' +
        'Light moves in it like water under a moon.',
      canBeCarried: true,
    })
  }

  /** No direct blocking; gating enforced during `pickedUp()`. */
  override preventPickup(): string {
    return ''
  }

  /** Handle gated acquisition, reversing pickup if prerequisites unmet. */
  override pickedUp(gameState: GameState): string {
    const vow = gameState.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)
    if (!vow) {
      gameState.removeItemFromInventory(this.name, 1)
      gameState.currentRoom.addItem(this)
      return clue('Wards flare as you touch the crystal, locking it in place.')
    }
    gameState.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    return 'The crystal is cold, and steady in your hand.'
  }
}
