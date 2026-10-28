import { Quest, type GameState } from '@/engine'

/** Side quest: fish the shiny ring out of the well with the magnetic rod. */
export class MagnetFishingExpeditionQuest extends Quest {
  constructor() {
    super({
      name: 'Magnet fishing expedition',
      description:
        'Something shiny lies at the bottom of the well, too deep for hands. ' +
        'The magnet might reach it, on a long enough rod.',
      completion: 'The well gave up a silver ring, and something else besides.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getItem('magnetic fishing rod') !== null
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getItem('shiny ring') !== null
  }
}
