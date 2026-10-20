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
        "the Crystal of Light, the Phoenix Feather, and the Dragon's Scale.",
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
    this.description = ''
    let newDesc =
      'Prove Courage, Wisdom, and Selflessness by recovering the three relics: ' +
      "the Crystal of Light, the Phoenix Feather, and the Dragon's Scale."
    if (gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED)) {
      if (!this.flagState[FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED]) {
        this.flagState[FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED] = true
        updated = true
      }
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        '\n\nYou have claimed the Crystal of Light; its steady brilliance answers ' +
        'your courage and steadies what the deep waters once denied. Sir ' +
        'Cedric bids you to press on—dark forces gather, and he needs allies ' +
        'skilled in magic to stand with him when the hour comes. '
    }

    // Add block for Phoenix Feather acquisition
    if (gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
      if (!this.flagState[FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED]) {
        this.flagState[FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED] = true
        updated = true
      }
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        '\n\nYou have obtained the Phoenix Feather. Its warmth pulses in your grasp, ' +
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
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        "\n\nYou have claimed the Dragon's Scale, its obsidian surface gleaming " +
        "with ancient power. The dragon's wisdom echoes in your mind, a testament " +
        'to the selflessness you have proven. With all three relics in hand, the ' +
        'final trial awaits—the Warding Rite that will determine the fate of all. '
    }
    this.description += newDesc
    return updated
  }

  /** Check if quest is completed when Act 3 main completion flag is set. */
  override checkCompletion(gameState: GameState): boolean {
    // Completes when Act 3 main completed flag set elsewhere (e.g., after Warding Rite)
    return gameState.getStoryFlag(FLAG_ACT3_MAIN_COMPLETED)
  }
}
