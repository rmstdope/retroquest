import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
} from '../Act3StoryFlags'

/** Quest: Calibrate vent stones and craft a heat ward to cross the Fumarole Passages. */
export class BreathOfTheMountain extends Quest {
  constructor() {
    super({
      name: 'Breath of the Mountain',
      description:
        'The Fumarole Passages exhale waves of heat and steam, blocking the way forward. ' +
        'Find a way to cross the shifting vents and reach the heights to the south.',
      completion:
        'You set the vent stones, sealed the vents with ash-fern and slag, ' +
        "counted the mountain's breath, and crossed to the crater on the " +
        'in-breath.',
    })
  }

  /** Mark quest as started. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED)
  }

  /** Quest is complete when the heat ward is applied and vents are calibrated. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED)
  }
}
