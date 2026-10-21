import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_TOWER_STAIR_OPEN } from '../Act4StoryFlags'
import { ChamberOfWhispers } from '../rooms/ChamberOfWhispers'
import { TowerOfShadows } from '../rooms/TowerOfShadows'

/**
 * The medallion Mira presses into Elior's hand at the gate. In the Tower of
 * Shadows it lets the friends' names be heard; its warmth carries up into the
 * Chamber of Whispers.
 */
export class LoyaltyToken extends Item {
  constructor() {
    super({
      name: 'Loyalty Token',
      description:
        'A small silver medallion stamped with two clasped hands, warm from ' +
        'the friends who pressed it into your hand. Whoever carries it is ' +
        'not alone, and knows it.',
      canBeCarried: true,
    })
  }

  /** In the tower it hints at the names (or is quiet once the stair is open); elsewhere it only warms. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof TowerOfShadows) {
      if (gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)) {
        return '[dim]The token is quiet and warm. The whispers are gone.[/dim]'
      }
      return event(
        'You hold the token up, and it grows warm. Under the whispers, very ' +
          "faint, you think you hear your name, in Mira's voice. They are " +
          'not gone. Say their names.',
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
