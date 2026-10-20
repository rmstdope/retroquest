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
        'With patience and ingenuity, Elior crafts a heat ward from ash-fern and cooled ' +
        "slag, then calibrates the mountain's ancient vents to breathe in a steady, safe " +
        'rhythm. ' +
        "The searing passages yield, opening the way to the Phoenix's crater and the next " +
        'trial of wisdom.',
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
