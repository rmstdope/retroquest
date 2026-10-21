import { Item, type Character, type GameState, event } from '@/engine'
import { FLAG_ACT4_SERVANTS_TRUST_EARNED } from '../Act4StoryFlags'
import { TrappedServants } from '../characters/TrappedServants'
import { HallOfEchoes } from '../rooms/HallOfEchoes'
import { OuterCourtyard } from '../rooms/OuterCourtyard'

/** The distilled essence of a guardian's courage, enabling acts of selflessness. */
export class GuardiansEssence extends Item {
  constructor() {
    super({
      name: "Guardian's Essence",
      description:
        'A swirling orb of golden light that contains the purified essence of ' +
        "a guardian's courage. The light within shifts and dances, radiating " +
        'warmth and determination. This essence proves your worthiness to those ' +
        'who have suffered under shadow magic.',
      canBeCarried: true,
    })
  }

  /** Use Guardian's Essence on servants to prove worthiness. */
  override useOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    if (
      targetCharacter instanceof TrappedServants &&
      gameState.currentRoom instanceof OuterCourtyard
    ) {
      if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
        gameState.setStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED, true)
        return event(
          "You present the Guardian's Essence to the trapped servants. " +
            'The golden light recognizes their suffering and your courage in ' +
            "facing the shadow guardians. The servants' eyes brighten with hope " +
            'as they sense your worthiness to help them.',
        )
      }
      return '[dim]The servants already recognize your worthiness.[/dim]'
    }
    return super.useOnCharacter(gameState, targetCharacter)
  }

  /** Use Guardian's Essence to prove worthiness. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof OuterCourtyard) {
      return event(
        "The Guardian's Essence glows brightly, ready to prove your " +
          'worthiness to those who need your help. Try using it on the servants.',
      )
    }
    if (gameState.currentRoom instanceof HallOfEchoes) {
      return event(
        "The Guardian's Essence resonates with the ancient hall, " +
          'recognizing the nobility that once existed here.',
      )
    }
    return event(
      "The Guardian's Essence pulses gently, waiting for the right " +
        'moment to demonstrate your courage.',
    )
  }
}
