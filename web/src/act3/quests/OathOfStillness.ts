import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_OATH_OF_STILLNESS_STARTED,
} from '../Act3StoryFlags'

/** Quiet the wandering phantoms in the Echo Chambers before the dragon's hall. */
export class OathOfStillness extends Quest {
  constructor() {
    super({
      name: 'Oath of Stillness',
      description:
        'The Echo Chambers whisper with restless phantoms that block the path to the ' +
        "dragon's hall. Ancient voices drift through the darkness, their words lost to " +
        'time but their purpose clear—they seek the sacred ritual that will grant them ' +
        'peace. The runic walls hold secrets of old ceremonies, and somewhere within ' +
        'these carved passages lies the key to silencing their eternal unrest. The echo ' +
        'stones await a blessed chant, one that must be spoken with reverence and ' +
        'precision to quiet the wandering spirits.',
      completion:
        'The Resonant Chant has quieted the wandering phantoms, its sacred words ' +
        'echoing through the stillness like ripples across a mirror-dark pond. One ' +
        'by one, the restless spirits begin to shimmer and fade, their ethereal forms ' +
        'growing translucent as centuries of anguish finally release their hold. ' +
        'Ancient faces turn toward you with expressions of profound gratitude before ' +
        'dissolving into motes of silver light that drift upward like falling stars ' +
        "in reverse. The phantoms' whispered syllables transform into gentle sighs " +
        'of relief as they slip between the boundaries of reality, crossing from ' +
        'this dimension into the peaceful void beyond. Their luminous essence swirls ' +
        'in spiraling patterns before vanishing entirely, leaving behind only the ' +
        'faintest trace of ozone and the profound silence they had so desperately ' +
        'sought. The illusions have fallen silent, the ancient burden lifted, and ' +
        "the path to the dragon's hall now lies open, bathed in the sacred " +
        'luminescence of your completed ritual.',
    })
  }

  /** Trigger when Miners' Rescue is completed and player accesses Echo Chambers. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_STARTED)
  }

  /** Complete when the oath has been performed and illusions are silenced. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)
  }

  /** Return false as this is a side quest. */
  override isMain(): boolean {
    return false
  }
}
