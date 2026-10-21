import { Room, type Exits, type GameState } from '@/engine'
import { FLAG_ACT4_LOYALTY_TOKEN_RAISED } from '../Act4StoryFlags'

/**
 * A twisted tower where shadows take corporeal form and doubt runs rampant.
 *
 * Tests the player's resolve against psychological attacks; the loyalty token
 * proves bonds of trust to dispel shadow magic.
 */
export class TowerOfShadows extends Room {
  constructor() {
    super({
      name: 'Tower of Shadows',
      description:
        'A spiraling tower of black stone pierces the gloom, its walls seeming to ' +
        'absorb light itself. Tendrils of living shadow coil around the structure, ' +
        'reaching out with grasping fingers toward any source of warmth or hope. ' +
        'The air grows thicker with each step upward, and whispered doubts slither ' +
        'into your mind like poison. Windows reveal only deeper darkness, and the ' +
        'very shadows appear to mock your every movement with silent, dancing forms.',
      items: [],
      characters: [],
      exits: { west: 'HallOfEchoes', up: 'ChamberOfWhispers' },
    })
  }

  /** The way back west is always open; the stair up once the token is raised. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED)) {
      return { west: this.exits.west }
    }
    return { west: this.exits.west, up: this.exits.up }
  }

  /** The whispers block the stair until the Loyalty Token is raised. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'up') return null
    if (gameState.getStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED)) return null
    return (
      '[failure]You set your foot on the stair, and the whispers close in: ' +
      'your friends have left you, no one is coming, you were always alone. ' +
      'You stumble back down.[/failure]'
    )
  }
}
