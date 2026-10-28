import { Character, type GameState, dialogue } from '@/engine'
import {
  FLAG_BRENN_FORGIVEN,
  FLAG_LOST_CARAVAN_COMPLETED,
} from '../Act2StoryFlags'

/**
 * Thorne's caravan guard, who fled when the ravine path gave way and sits in
 * the Merchant's Warehouse. He has one conversation and no quest; what he
 * says follows the caravan story: his side of it, then thanks and a hint once
 * the caravan is home, then his promise once Elior has spoken for him.
 */
export class Brenn extends Character {
  constructor() {
    super({
      name: 'brenn',
      description:
        'A young caravan guard sits on a crate by the door, one hand wrapped ' +
        'in a dirty bandage. He jumps whenever someone comes in, as if he ' +
        'expects to be thrown out.',
    })
  }

  /** His line for the current step of the caravan story; the same every time. */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_BRENN_FORGIVEN)) {
      return dialogue(
        this.name,
        'Thorne says one more road. He says somebody spoke for me. ' +
          "… I won't run again. Not this time.",
      )
    }
    if (gameState.getStoryFlag(FLAG_LOST_CARAVAN_COMPLETED)) {
      return dialogue(
        this.name,
        "They're home? All of them? … Thank you. Thorne says I'm to have " +
          "my wages and not a copper more. I suppose that's fair. I ran. " +
          'Unless somebody told him what it was like out there. ' +
          "He'd never hear it from me.",
      )
    }
    return dialogue(
      this.name,
      "If you've come from Thorne, you'll have heard. The path just went, " +
        'out from under the wagons. I was hanging over the ravine by one ' +
        'hand. When I got up I ran for help, I swear I did. But the forest ' +
        "turned me round, and I couldn't find the road again for two days. " +
        'So I came back. Somebody had to tell him.',
    )
  }
}
