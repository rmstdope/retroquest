import { Room, type Exits, type GameState } from '@/engine'
import {
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_PARENTS_LEGACY_STARTED,
} from '../Act4StoryFlags'
import { Memories } from '../items/Memories'
import { PARENTS_VAULT_BEFORE } from './vaultDescriptions'

/**
 * The quiet room behind the sealed door, where Aren and Lysa's last memories
 * wait. Seeing them completes The Parent's Legacy and opens the way north to
 * the Throne Chamber.
 */
export class ParentsVault extends Room {
  constructor() {
    super({
      name: "Parents' Vault",
      description: PARENTS_VAULT_BEFORE,
      items: [new Memories()],
      characters: [],
      exits: { west: 'MemoryVault', north: 'ThroneChamer' },
    })
  }

  /** Entering the vault starts The Parent's Legacy. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_STARTED, true)
  }

  /** West is always open; north once the memories are seen. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)) {
      return { west: this.exits.west }
    }
    return { west: this.exits.west, north: this.exits.north }
  }

  /** The way north is shut until the memories are seen. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'north') return null
    if (gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)) return null
    return (
      '[failure]The door to the north is shut. The lanterns are still ' +
      'waiting for you.[/failure]'
    )
  }
}
