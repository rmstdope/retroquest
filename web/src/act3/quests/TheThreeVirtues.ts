import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGON_OATH_SPOKEN,
  FLAG_ACT3_OATH_SCROLLS_EXAMINED,
} from '../Act3StoryFlags'
import { EchoChambers } from '../rooms/EchoChambers'

/** What Mira told Elior about Malakar and the three relics that can stand against him. */
const OPENING_ENTRY =
  'Mira says Malakar is draining the life out of King Alden. ' +
  'Three relics can stand against him: the crystal of light, ' +
  "the phoenix feather and the dragon's scale."

/** The hint's opening once the dragon has asked for the oath. */
const OATH_ASKED =
  'The dragon will not give its scale for the asking. There is an old ' +
  'oath for it, and its words are '

/** Where the oath's words are while the scrolls are still hidden. */
const SCROLLS_HIDDEN =
  'kept in the Echo Chambers, tucked out of sight at the back of an alcove.'

/** Where the oath's words are once the scrolls are found but unread. */
const SCROLLS_UNREAD =
  'on the old scrolls you found in the Echo Chambers. ' +
  'You have not read them yet.'

/** Quest to prove Courage, Wisdom, and Selflessness to unlock the final ritual. */
export class TheThreeVirtuesQuest extends Quest {
  private flagState: Record<string, boolean> = {}

  constructor() {
    super({
      name: 'The Three Virtues',
      description: OPENING_ENTRY,
    })
  }

  /** Return true as this is the main quest for Act III. */
  override isMain(): boolean {
    return true
  }

  /**
   * Once the dragon has asked for the oath and the scrolls are unread, point
   * at where its words are: the alcove while the scrolls are hidden, the
   * scrolls once found. Otherwise the newest journal entry.
   */
  override hint(gameState: GameState): string | null {
    const oathAsked =
      gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED) &&
      !gameState.getStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED) &&
      !gameState.getStoryFlag(FLAG_ACT3_DRAGON_OATH_SPOKEN)
    if (!oathAsked) return super.hint(gameState)
    const chambers = gameState.allRooms.EchoChambers
    const found = chambers instanceof EchoChambers && chambers.scrollsDiscovered
    return OATH_ASKED + (found ? SCROLLS_UNREAD : SCROLLS_HIDDEN)
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
    let newDesc = OPENING_ENTRY
    if (gameState.getStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED)) {
      if (!this.flagState[FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED]) {
        this.flagState[FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\nYou walked into the black water and named what you did not ' +
        'abandon: yourself. The guardian gave you the crystal of light. ' +
        'Sir Cedric has said little since it asked him the same question. '
    }

    // Add block for Phoenix Feather acquisition
    if (gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
      if (!this.flagState[FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED]) {
        this.flagState[FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\nYou answered the phoenix: wisdom is patience, even when the ' +
        'world burns. It gave you a feather, and told you of a Warden who ' +
        'had none. '
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
