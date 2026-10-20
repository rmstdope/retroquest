import { Item, type Character, type GameState } from '@/engine'
import {
  FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED,
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
} from '../Act4StoryFlags'

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

  /** Set flag when the essence is acquired. */
  override pickedUp(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, true)
    return ''
  }

  /** Use Guardian's Essence on servants to prove worthiness. */
  override useOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    if (
      targetCharacter.name.toLowerCase().includes('servant') &&
      gameState.currentRoom.name === 'Outer Courtyard'
    ) {
      if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
        gameState.setStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED, true)
        return (
          "[event]You present the Guardian's Essence to the trapped servants. " +
          'The golden light recognizes their suffering and your courage in ' +
          "facing the shadow guardians. The servants' eyes brighten with hope " +
          'as they sense your worthiness to help them.[/event]'
        )
      }
      return '[dim]The servants already recognize your worthiness.[/dim]'
    }
    return super.useOnCharacter(gameState, targetCharacter)
  }

  /** Use Guardian's Essence to prove worthiness. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom.name === 'Outer Courtyard') {
      return (
        "[event]The Guardian's Essence glows brightly, ready to prove your " +
        'worthiness to those who need your help. Try using it on the servants.[/event]'
      )
    }
    if (gameState.currentRoom.name === 'Hall of Echoes') {
      return (
        "[event]The Guardian's Essence resonates with the ancient hall, " +
        'recognizing the nobility that once existed here.[/event]'
      )
    }
    return (
      "[event]The Guardian's Essence pulses gently, waiting for the right " +
      'moment to demonstrate your courage.[/event]'
    )
  }
}
