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
        'A small silver medallion bearing the emblem of intertwined hands. ' +
        'The surface is warm to the touch and emanates a sense of trust and ' +
        'loyalty. This token represents the bonds formed with those you have ' +
        'helped, and serves as proof against deception and lies.',
      canBeCarried: true,
    })
  }

  /** Use the loyalty token to resist deception (raised once, in the tower). */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof TowerOfShadows) {
      if (!gameState.getStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED)) {
        gameState.setStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED, true)
        return event(
          'You hold the Loyalty Token close to your heart, feeling the ' +
            "warmth of true friendship and trust. The token's power forms a " +
            'protective barrier against the lies and deceptions that whisper ' +
            'through the shadowy tower.',
        )
      }
      return '[dim]The Loyalty Token is already protecting you from deception.[/dim]'
    }
    if (gameState.currentRoom instanceof ChamberOfWhispers) {
      return (
        '[dim]The token is still warm against your heart. Her whispers ' +
        'cannot reach you.[/dim]'
      )
    }
    return event(
      'The Loyalty Token glows softly, ready to prove the strength ' +
        'of your bonds when facing deception.',
    )
  }
}
