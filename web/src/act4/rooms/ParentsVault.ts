import { Room, type Exits, type GameState, clue } from '@/engine'
import {
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_PARENTS_LEGACY_STARTED,
} from '../Act4StoryFlags'
import { MemoryEchoes } from '../characters/MemoryEchoes'
import { Memories } from '../items/Memories'
import { PARENTS_VAULT_AFTER, PARENTS_VAULT_BEFORE } from './vaultDescriptions'

/**
 * The quiet room behind the sealed door, where Aren and Lysa's last memories
 * wait. Seeing them completes The Parents' Legacy and opens the way north to
 * the Throne Chamber.
 */
export class ParentsVault extends Room {
  constructor() {
    super({
      name: "Parents' Vault",
      description: PARENTS_VAULT_BEFORE,
      items: [new Memories()],
      characters: [new MemoryEchoes()],
      exits: { west: 'MemoryVault', north: 'ThroneChamber' },
    })
  }

  /** Saves from before Aren and Lysa could be addressed get them back. */
  override refreshSavedText(_gameState: GameState): void {
    if (!this.characters.some((c) => c instanceof MemoryEchoes)) {
      this.addCharacter(new MemoryEchoes())
    }
  }

  /** Once the memories have been seen, the lanterns are dim. */
  override descriptionFor(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)) {
      return PARENTS_VAULT_AFTER
    }
    return super.descriptionFor(gameState)
  }

  /** Entering the vault starts The Parents' Legacy. */
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
    return clue(
      'The door to the north is shut. The lanterns are still ' +
        'waiting for you.',
    )
  }
}
