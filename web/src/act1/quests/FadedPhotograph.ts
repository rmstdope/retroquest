import { Quest, type GameState, characterName } from '@/engine'
import {
  FLAG_FISHERMAN_TOLD_OF_TIN,
  FLAG_FOUND_MOTHERS_LETTER,
  FLAG_FOUND_PHOTO,
  FLAG_READ_MOTHERS_LETTER,
  FLAG_READ_PHOTO_MESSAGE,
  FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO,
} from '../Act1StoryFlags'

/** The opening entry: what was found, not what to do next. */
const OPENING =
  'An old photograph of your parents, hidden away in a drawer. ' +
  "On the back is a line in your mother's hand."

/**
 * The faded photograph quest: find the photograph in Elior's cottage, read the
 * cryptic message on its back, ask Grandmother about it, then follow the
 * message to the river bend, where the fisherman leads Elior to his mother's
 * letter. Reading the letter completes the quest. Its log is a journal that
 * gains one entry per step taken, so the hint always names the next one.
 */
export class FadedPhotographQuest extends Quest {
  constructor() {
    super({
      name: 'The faded photograph',
      description: OPENING,
      completion:
        "At the river bend you found your mother's letter, hidden beneath the smooth stone. " +
        'Its words raise more questions than they answer, but they are hers.',
    })
  }

  /** Give a save made with the title-case name the current name and completion. */
  override refreshSavedText(): void {
    const current = new FadedPhotographQuest()
    this.name = current.name
    this.completion = current.completion
  }

  /** Triggered when the player finds the photograph. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_FOUND_PHOTO)
  }

  /**
   * Rebuild the journal from the steps taken, in the design's order; a step
   * skipped (the fisherman before Grandmother) leaves no entry. Reports a
   * change only when an entry was added.
   */
  override checkUpdate(gameState: GameState): boolean {
    const steps: Array<[string, string]> = [
      [
        FLAG_READ_PHOTO_MESSAGE,
        'The line on the back says to seek the truth where the river bends.' +
          ` Your ${characterName('grandmother')} knew your mother's hand ` +
          'better than anyone.',
      ],
      [
        FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO,
        `Your ${characterName('grandmother')} says your mother loved the river. ` +
          `The old ${characterName('fisherman')} at the ` +
          '[room_name]Riverbank[/room_name] will remember what she did there.',
      ],
      [
        FLAG_FISHERMAN_TOLD_OF_TIN,
        `The bend is the ${characterName('fisherman')}'s spot. ` +
          'The night before she went away, your mother hid a tin under the ' +
          "[item_name]smooth stone[/item_name] at the water's edge.",
      ],
      [
        FLAG_FOUND_MOTHERS_LETTER,
        'The tin under the [item_name]smooth stone[/item_name] held a letter ' +
          "in your mother's hand. You have not read it yet.",
      ],
    ]
    const stages = [
      OPENING,
      ...steps
        .filter(([flag]) => gameState.getStoryFlag(flag))
        .map(([, text]) => `\n${text}`),
    ]
    if (stages.length === (this.earlierStages?.length ?? 0) + 1) return false
    this.setJournal(stages.slice(0, -1), stages[stages.length - 1])
    return true
  }

  /** Completed when the player reads the mother's letter from the river bend. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_READ_MOTHERS_LETTER)
  }
}
