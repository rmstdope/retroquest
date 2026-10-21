import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED,
} from '../Act4StoryFlags'

/** Side quest: mend the Memory Vault's orbs and answer the Shadow of the Past. */
export class TheShadowOfThePast extends Quest {
  constructor() {
    super({
      name: 'The Shadow of the Past',
      description:
        'Among the broken memories a shadow reaches for scenes it cannot ' +
        'hold. Mend what it has lost, and learn whose voice it is.',
      completion:
        'Elior learns that the voice from his dreams is what remains of ' +
        "Malakar's better self. The sealed door to the east now answers to " +
        'the amulet.',
    })
  }

  /** Start on first entering the Memory Vault (or first meeting the Shadow). */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED) ||
      gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)
    )
  }

  /** Complete when the Shadow is answered. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)
  }
}
