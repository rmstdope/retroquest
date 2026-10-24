import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_DRAGONS_SCALE_ACQUIRED } from '../Act3StoryFlags'

/** The Dragon's Scale relic representing Selflessness. */
export class DragonsScale extends Item {
  constructor() {
    super({
      name: "Dragon's Scale",
      description:
        'A scale from the ancient dragon, dark as midnight yet shot ' +
        'through with veins of deep gold. It pulses with a slow, steady ' +
        'warmth and weighs heavy with the promise of protection and ' +
        'sacrifice.',
      canBeCarried: true,
      shortName: 'scale',
    })
  }

  /** Handle taking the Dragon's Scale relic with prerequisite checks. */
  override pickedUp(gameState: GameState): string {
    // Requirements met, allow pickup
    gameState.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    return (
      "The dragon's scale settles into your hands with surprising " +
      'weight. You feel the burden of responsibility and the strength that ' +
      'comes from selfless action. The relic pulses warmly against your ' +
      'palm.'
    )
  }
}
