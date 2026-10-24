import { Item, type GameState } from '@/engine'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL,
  FLAG_ACT4_TOWER_STAIR_OPEN,
} from '../Act4StoryFlags'
import { HallOfEchoes } from '../rooms/HallOfEchoes'
import { ChamberOfWhispers } from '../rooms/ChamberOfWhispers'
import { TowerOfShadows } from '../rooms/TowerOfShadows'

/**
 * The medallion Mira presses into Elior's hand at the gate. In the Tower of
 * Shadows it lets the friends' names be heard; its warmth carries up into the
 * Chamber of Whispers. Raised in the Hall of Echoes it holds the knight's
 * despair off, as the Guardian's Chain does, until the knight is redeemed.
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

  /** In the hall it can be raised against the knight's despair; in the tower it hints at the names (or is quiet once the stair is open); elsewhere it only warms. */
  override use(gameState: GameState): string {
    if (
      gameState.currentRoom instanceof HallOfEchoes &&
      !gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)
    ) {
      if (!gameState.getStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL)) {
        gameState.setStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL, true)
        return (
          'You hold the Loyalty Token close to your heart. For a moment you ' +
          'are not alone in the hall: the servants you freed, the friends ' +
          'who brought you to the threshold, everyone who trusted you on ' +
          "the way here. The knight's despair breaks around you and does " +
          'not reach you.'
        )
      }
      return (
        "[dim]The token is still warm against your heart. The knight's " +
        'despair cannot reach you.[/dim]'
      )
    }
    if (gameState.currentRoom instanceof TowerOfShadows) {
      if (gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)) {
        return '[dim]The token is quiet and warm. The whispers are gone.[/dim]'
      }
      return (
        'You hold the token up, and it grows warm. Under the whispers, very ' +
        "faint, you think you hear your name, in Mira's voice. They are " +
        'not gone. Say their names.'
      )
    }
    if (gameState.currentRoom instanceof ChamberOfWhispers) {
      return (
        '[dim]The token is still warm against your heart. Her whispers ' +
        'cannot reach you.[/dim]'
      )
    }
    return (
      'The token is warm in your hand. Someone, somewhere, is glad you ' +
      'came.'
    )
  }
}
