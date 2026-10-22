import { Quest, type GameState } from '@/engine'
import { TheDream } from '../rooms/TheDream'

/** Side quest: visit every room of Willowbrook. */
export class KnowYourVillageQuest extends Quest {
  constructor() {
    super({
      name: 'Know your village',
      description:
        'You are encouraged to explore and get to know every corner of Willowbrook. The village holds many secrets for you to discover.',
      completion:
        'You have explored every corner of Willowbrook. The village feels more like home, and you are ready for what lies ahead.',
    })
  }

  /** Triggered when the player leaves Elior's Cottage for the first time. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.visitedRooms.length > 1
  }

  /**
   * Completed when every room of the village has been visited. The dream
   * the act opens with is not a corner of Willowbrook and does not count.
   */
  override checkCompletion(gameState: GameState): boolean {
    return Object.values(gameState.allRooms)
      .filter((room) => !(room instanceof TheDream))
      .every((room) => gameState.visitedRooms.includes(room.name))
  }
}
