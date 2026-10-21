import { Room, type Exits, type GameState } from '@/engine'
import {
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
} from '../Act4StoryFlags'
import { SorceressOfLies } from '../characters/SorceressOfLies'
import { SorceressStaff } from '../items/SorceressStaff'
import { CHAMBER_FIRST_LOOK_SENTENCE } from './chamberDescriptions'

/**
 * The sorceress's domain where truth becomes malleable and lies feel real.
 *
 * Confrontation with the Sorceress of Lies, testing empathy and understanding;
 * the arch north to the Memory Vault opens once she is redeemed.
 */
export class ChamberOfWhispers extends Room {
  constructor() {
    super({
      name: 'Chamber of Whispers',
      description:
        'A round room at the top of the tower, and the only beautiful room in ' +
        'the fortress. That is what is wrong with it. Crystals grow from the ' +
        'walls, each humming something kind and untrue, and the floor gives a ' +
        'little under your feet, like ice that might hold.' +
        CHAMBER_FIRST_LOOK_SENTENCE,
      items: [new SorceressStaff()],
      characters: [new SorceressOfLies()],
      exits: { down: 'TowerOfShadows', north: 'MemoryVault' },
    })
  }

  /** Entering the chamber starts the Sorceress's side quest. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
  }

  /** The way down is always open; the arch north once the Sorceress is redeemed. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return { down: this.exits.down }
    }
    return { down: this.exits.down, north: this.exits.north }
  }

  /** The Sorceress holds the north arch shut. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'north') return null
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED))
      return null
    return (
      '[failure]The north arch is a wall of whispering crystal. It will not ' +
      'open while the Sorceress holds the chamber.[/failure]'
    )
  }
}
