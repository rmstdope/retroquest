import { Item, event, type GameState } from '@/engine'
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
        'A palm-sized prism humming with soft radiance. Within it swirl echoes ' +
        'of moonlit tides and layered ward patterns waiting to converge.',
      canBeCarried: true,
    })
  }

  /** Return descriptive examination text referencing ambient progress cues. */
  override examine(_gameState: GameState): string {
    return event(
      "The crystal's facets amplify the faintest glow, casting sigil-like " +
        'refractions. It seems to breathe with the tide.',
    )
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
      return (
        '[failure]Wards flare as you touch the crystal, locking it in place. ' +
        '[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    return event(
      'The crystal steadies in your grasp, radiance aligning with your ' +
        'resolve.',
    )
  }
}
