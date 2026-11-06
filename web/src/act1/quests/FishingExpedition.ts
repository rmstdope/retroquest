import { characterName, Quest, type GameState } from '@/engine'
import {
  FLAG_HEALED_FISHERMAN_ARM,
  FLAG_TALKED_TO_FISHERMAN,
} from '../Act1StoryFlags'

/** The opening while the fisherman's arm is still stiff. */
const STIFF_ARM =
  `The ${characterName('fisherman')} at the bend can't fish with his stiff arm, ` +
  'and he would give a good deal for a fresh fish.'

/** The log once heal has mended his arm. */
const ARM_MENDED =
  `You mended the ${characterName('fisherman')}'s arm, but he won't cast ` +
  'his own line till tomorrow. Today he would still give a good deal for ' +
  'a fresh fish.'

/**
 * Side quest: help the troubled fisherman. Its log stops calling his arm
 * stiff once heal has mended it, and still leads to the fish.
 */
export class FishingExpeditionQuest extends Quest {
  constructor() {
    super({
      name: 'Fishing expedition',
      description: STIFF_ARM,
      completion:
        `You brought the ${characterName('fisherman')} a fish, ` +
        "and he gave you back something of your mother's: " +
        'the spell she taught him at the bend.',
    })
  }

  /** Starts when Elior first talks to him, told as his arm is then. */
  override checkTrigger(gameState: GameState): boolean {
    if (!gameState.getStoryFlag(FLAG_TALKED_TO_FISHERMAN)) return false
    if (gameState.getStoryFlag(FLAG_HEALED_FISHERMAN_ARM)) {
      this.setJournal([], ARM_MENDED)
    }
    return true
  }

  /** Once heal has mended his arm, the log moves on to the mended arm, once. */
  override checkUpdate(gameState: GameState): boolean {
    if (
      !gameState.getStoryFlag(FLAG_HEALED_FISHERMAN_ARM) ||
      this.latestStage
    ) {
      return false
    }
    this.setJournal([STIFF_ARM], ARM_MENDED)
    return true
  }

  /** Completed once he has taught Elior purify for the fish. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.hasSpell('purify')
  }
}
