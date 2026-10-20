import { Quest, type GameState } from '@/engine'
import { AbandonedShed } from '../rooms/AbandonedShed'

/** Side quest: find a way into the locked Abandoned Shed. */
export class CuriosityKilledTheCatQuest extends Quest {
  constructor() {
    super({
      name: 'Curiosity killed the cat',
      description:
        'You stand before a locked shed, its secrets hidden from you. What will you discover if you find a way inside?',
      completion:
        'You have unlocked the Abandoned Shed and revealed its secrets. Your curiosity has led you deeper into the mysteries of Willowbrook.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.visitedRooms.includes('Abandoned Shed')
  }

  override checkCompletion(gameState: GameState): boolean {
    // Completed once the shed door has been unlocked
    const shed = gameState.getRoom('Abandoned Shed')
    return shed instanceof AbandonedShed && !shed.locked
  }
}
