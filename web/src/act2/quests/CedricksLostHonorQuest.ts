import { Quest, type GameState } from '@/engine'
import {
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_READ_SQUIRES_DIARY,
  FLAG_EXAMINED_SECRET_DOCUMENTS,
} from '../Act2StoryFlags'

/** The journal's opening entry. */
const START_TEXT =
  'Sir Cedric was stripped of his knighthood after the night King Alden ' +
  'vanished: two men of the night watch swore he had left his post. ' +
  'Investigate what happened that night and find evidence to clear his name.'

/** The journal entry once the squires and their diary have been heard. */
const DIARY_TEXT =
  '\n\nAccording to the squires and their diary, one of the watchmen who ' +
  'accused Cedric fled to Heavensforth and sent papers back with a merchant ' +
  'caravan that never arrived. Find these papers to restore his honor.'

/** The journal entry once the papers have been examined. */
const EXAMINED_TEXT =
  "\n\nYou have found the papers: a watchman's confession that he and " +
  "another were paid to leave the king's postern unguarded and to blame Sir " +
  'Cedric, with the letter that paid them, sealed with a twisted rune. Present ' +
  'them to the Lord Commander in the Great Hall to restore his honor.'

/** The text shown when the quest completes. */
const COMPLETION_TEXT =
  "You have cleared Sir Cedric's name. The night watch was paid to leave the " +
  "king's postern open and to blame him, and the letter that paid them was " +
  "written in Malakar's name."

/** Quest to vindicate Sir Cedric by locating exonerating documents. */
export class CedricksLostHonorQuest extends Quest {
  squiresInfoAdded = false
  documentsExamined = false

  constructor() {
    super({
      name: "Cedric's Lost Honor",
      description: START_TEXT,
      completion: COMPLETION_TEXT,
    })
  }

  /** Bring the quest's stored texts up to date in a save made with older wording. */
  refreshText(gameState: GameState): void {
    this.completion = COMPLETION_TEXT
    // Started quests are rebuilt on load; settle the rest without reporting news.
    if (this.completed) this.checkUpdate(gameState)
    else if (!gameState.activatedQuests.includes(this))
      this.description = START_TEXT
  }

  /** Trigger after the Training Master is talked to and Echoes is complete. */
  override checkTrigger(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED) &&
      gameState.isQuestCompleted('Echoes of the Past')
    )
  }

  /** Quest is completed when the secret documents have been used to clear Cedric's name. */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)
  }

  /** Refresh the quest description when new squire or document information exists. */
  override checkUpdate(gameState: GameState): boolean {
    let updated = false
    const earlier: string[] = []
    let newDesc = START_TEXT
    // First update: when diary is read
    if (gameState.getStoryFlag(FLAG_READ_SQUIRES_DIARY)) {
      // Update the description to include information from the squires
      earlier.push(newDesc)
      newDesc = DIARY_TEXT
      if (!this.squiresInfoAdded) {
        updated = true
      }
      this.squiresInfoAdded = true
    }

    // Second update: when secret documents are examined
    if (gameState.getStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS)) {
      // Update the description to include information about finding the evidence
      earlier.push(newDesc)
      newDesc = EXAMINED_TEXT
      if (!this.documentsExamined) {
        updated = true
      }
      this.documentsExamined = true
    }
    this.setJournal(earlier, newDesc)

    return updated
  }
}
