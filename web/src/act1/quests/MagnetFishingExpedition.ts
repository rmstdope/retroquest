import { Quest, type GameState } from '@/engine'

/** Side quest: fish the shiny ring out of the well with the magnetic rod. */
export class MagnetFishingExpeditionQuest extends Quest {
  constructor() {
    super({
      name: 'Magnet fishing expedition',
      description:
        'You have assembled a strange fishing rod with a magnet. Time to go on another fishing expedition!',
      completion:
        'You have retrieved the shiny ring from the well, proving your ingenuity and determination.',
    })
  }

  override checkTrigger(gameState: GameState): boolean {
    return gameState.getItem('magnetic fishing rod') !== null
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getItem('shiny ring') !== null
  }
}
