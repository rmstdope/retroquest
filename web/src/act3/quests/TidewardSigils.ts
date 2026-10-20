import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_TIDEWARD_SIGILS_STARTED,
} from '../Act3StoryFlags'

/** Quest to stabilize flood wards by engraving Tideward Sigils. */
export class TidewardSigilsQuest extends Quest {
  constructor() {
    super({
      name: 'Tideward Sigils',
      description:
        'Ancient warding pillars stand along the drowned causeway — relics of ' +
        'coastal rites that once bent the tides to human will. You must cleanse ' +
        'and activate them by engraving a full Moon Sigil to steady the flood ' +
        'wards and gain safe passage to the sanctum.',
      completion:
        'You cleansed the pillars and set the Moon Rune shards—the Moon ' +
        'Sigil resonates and the flood wards steady, granting safe passage ' +
        'toward the sanctum.',
    })
  }

  /** Check if quest should trigger when reaching Shoreline Markers. */
  override checkTrigger(gameState: GameState): boolean {
    // Activate when the game has set the Tideward Sigils started flag.
    return gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_STARTED)
  }

  /** Check if quest is completed based on sigils being completed. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)
  }
}
