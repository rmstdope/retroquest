import { Quest, type GameState } from '@/engine'
import { TheDream } from '../rooms/TheDream'

/** Side quest: visit every room of Willowbrook. */
export class KnowYourVillageQuest extends Quest {
  constructor() {
    super({
      name: 'Know your village',
      description:
        'Something pulls at you to walk every lane of Willowbrook, ' +
        'and to look properly at the places you have passed a thousand times.',
      completion:
        'You have walked every corner of Willowbrook. ' +
        'The pull has gone quiet, and the village feels like home.',
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
