import { Quest, type GameState } from '@/engine'
import {
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_READ_SQUIRES_DIARY,
  FLAG_EXAMINED_SECRET_DOCUMENTS,
} from '../Act2StoryFlags'

/** Quest to vindicate Sir Cedric by locating exonerating documents. */
export class CedricksLostHonorQuest extends Quest {
  squiresInfoAdded = false
  documentsExamined = false

  constructor() {
    super({
      name: "Cedric's Lost Honor",
      description:
        'Sir Cedric has been living under a cloud of disgrace due to false ' +
        'accusations of cowardice. Investigate the rumors about his past and ' +
        'find evidence to clear his name.',
      completion:
        "You have found the secret documents that prove Sir Cedric's innocence " +
        "and restored his honor! The knight's reputation has been cleared, and " +
        'he is grateful for your efforts to uncover the truth.',
    })
  }

  /** Quest is triggered when the Training Master is talked to. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED)
  }

  /** Quest is completed when the secret documents have been used to clear Cedric's name. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)
  }

  /** Refresh the quest description when new squire or document information exists. */
  override checkUpdate(gameState: GameState): boolean {
    let updated = false
    const earlier: string[] = []
    let newDesc =
      'Sir Cedric has been living under a cloud of disgrace due to false ' +
      'accusations of cowardice. Investigate the rumors about his past and ' +
      'find evidence to clear his name.'
    // First update: when diary is read
    if (gameState.getStoryFlag(FLAG_READ_SQUIRES_DIARY)) {
      // Update the description to include information from the squires
      earlier.push(newDesc)
      newDesc =
        '\n\nAccording to the squires and their diary, secret documents from ' +
        'Heavensforth that would clear his name went missing when a merchant ' +
        'caravan was lost. Find these documents to restore his honor.'
      if (!this.squiresInfoAdded) {
        updated = true
      }
      this.squiresInfoAdded = true
    }

    // Second update: when secret documents are examined
    if (gameState.getStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS)) {
      // Update the description to include information about finding the evidence
      earlier.push(newDesc)
      newDesc =
        '\n\nYou have found the secret documents! The evidence clearly proves ' +
        "Sir Cedric's innocence - he was protecting civilians and following " +
        'direct orders during the Battle of Thornfield Pass. Now you need ' +
        'to present this evidence to restore his honor.'
      if (!this.documentsExamined) {
        updated = true
      }
      this.documentsExamined = true
    }
    this.setJournal(earlier, newDesc)

    return updated
  }
}
