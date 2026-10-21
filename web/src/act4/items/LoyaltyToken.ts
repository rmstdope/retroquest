import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_LOYALTY_TOKEN_RAISED } from '../Act4StoryFlags'
import { ChamberOfWhispers } from '../rooms/ChamberOfWhispers'
import { TowerOfShadows } from '../rooms/TowerOfShadows'

/**
 * A token that proves the bonds of trust with freed allies. Raised once in the
 * Tower of Shadows, its protection carries up into the Chamber of Whispers.
 */
export class LoyaltyToken extends Item {
  constructor() {
    super({
      name: 'Loyalty Token',
      description:
        'A small silver token stamped with two clasped hands, still warm from ' +
        'the servant who gave it to you. Whoever carries it is not alone, and ' +
        'knows it.',
      canBeCarried: true,
    })
  }

  /** Use the loyalty token to resist deception (raised once, in the tower). */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof TowerOfShadows) {
      if (!gameState.getStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED)) {
        gameState.setStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED, true)
        return event(
          'You hold the token against your chest. It is still warm. The ' +
            'whispers say no one is coming; the token says someone already ' +
            'did.',
        )
      }
      return (
        '[dim]The token is warm against your heart. The whispers cannot find ' +
        'their way in.[/dim]'
      )
    }
    if (gameState.currentRoom instanceof ChamberOfWhispers) {
      return (
        '[dim]The token is still warm against your heart. Her whispers ' +
        'cannot reach you.[/dim]'
      )
    }
    return event(
      'The token is warm in your hand. Someone, somewhere, is glad you ' +
        'came.',
    )
  }
}
