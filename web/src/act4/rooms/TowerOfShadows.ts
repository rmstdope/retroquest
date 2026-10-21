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
        'A stair winds up inside the black stone, narrow and dark. The walls ' +
        'are cold, and there are no windows. The shadows on the stair move a ' +
        'moment after you do. With every step, something quiet at your ear ' +
        'tells you why you should not have come.',
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
