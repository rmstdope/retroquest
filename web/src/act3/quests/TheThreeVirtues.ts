import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
} from '../Act3StoryFlags'

/** Quest to prove Courage, Wisdom, and Selflessness to unlock the final ritual. */
export class TheThreeVirtuesQuest extends Quest {
  private flagState: Record<string, boolean> = {}

  constructor() {
    super({
      name: 'The Three Virtues',
      description:
        'Prove Courage, Wisdom, and Selflessness by recovering the three relics: ' +
        "the crystal of light, the phoenix feather, and the dragon's scale.",
    })
  }

  /** Return true as this is the main quest for Act III. */
  override isMain(): boolean {
    return true
  }

  /** Check if quest should trigger when Mira starts the main plan. */
  override checkTrigger(gameState: GameState): boolean {
    // Trigger when Mira has started the main plan in Act III
    return gameState.getStoryFlag(FLAG_ACT3_MAIN_STARTED)
  }

  /** Update quest description based on acquired relics. */
  override checkUpdate(gameState: GameState): boolean {
    let updated = false
    const earlier: string[] = []
    let newDesc =
      'Prove Courage, Wisdom, and Selflessness by recovering the three relics: ' +
      "the crystal of light, the phoenix feather, and the dragon's scale."
    if (gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED)) {
      if (!this.flagState[FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED]) {
        this.flagState[FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\nYou have claimed the crystal of light; its steady brilliance answers ' +
        'your courage and steadies what the deep waters once denied. Sir ' +
        'Cedric has said little since the guardian asked him what he would ' +
        'not abandon. '
    }

    // Add block for Phoenix Feather acquisition
    if (gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
      if (!this.flagState[FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED]) {
        this.flagState[FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\nYou have obtained the phoenix feather. Its warmth pulses in your grasp, ' +
        'a living ember that refuses to die. The memory of fire and flight lingers, ' +
        'reminding you that hope can rise from ashes. The path ahead is clearer, ' +
        'but the final virtue remains. '
    }

    // Add block for Dragon's Scale acquisition
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
      if (!this.flagState[FLAG_ACT3_DRAGONS_SCALE_ACQUIRED]) {
        this.flagState[FLAG_ACT3_DRAGONS_SCALE_ACQUIRED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        "\n\nYou have the dragon's scale, heavy in your pack. With all three " +
        "relics in hand, Mira's Warding Rite is all that is left. "
    }
    this.setJournal(earlier, newDesc)
    return updated
  }

  /** Check if quest is completed when Act 3 main completion flag is set. */
  override checkCompletion(gameState: GameState): boolean {
    // Completes when Act 3 main completed flag set elsewhere (e.g., after Warding Rite)
    return gameState.getStoryFlag(FLAG_ACT3_MAIN_COMPLETED)
  }
}
