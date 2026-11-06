import { characterName, Quest, type GameState } from '@/engine'
import {
  FLAG_JOURNAL_READ,
  FLAG_LANTERN_LIT,
  FLAG_WOKE_FROM_DREAM,
} from '../Act1StoryFlags'

/**
 * The log's entries, one per step of the opening: the lantern, the journal
 * it finds, then Grandmother at the hearth. Later entries start a new line.
 */
const STAGES: readonly string[] = [
  'You woke with three words written down, somewhere in the dark by your ' +
    'bed, and a tune still going in the house. ' +
    'The [item_name]lantern[/item_name] would show you where.',
  '\nThe [item_name]lantern[/item_name] found your ' +
    '[item_name]journal[/item_name]. ' +
    'The three words are in it, with the rest of the dream.',
  `\n${characterName('Grandmother')} is at the hearth, ` +
    'humming the tune from your dream. She will want to hear about it.',
]

/**
 * Quest that unlocks the cottage exits after the player learns the revive
 * spell. Its log is a journal that grows by a step as Elior lights the
 * lantern and reads his journal, so the hint always names the next step.
 */
export class HintOfMagicQuest extends Quest {
  constructor() {
    super({
      name: 'Hint of magic',
      description: STAGES[0],
      completion:
        `${characterName('Grandmother')} told you of your father's journal, ` +
        'and his word for calling a thing back. ' +
        'It came to you as she spoke, and it stayed.',
    })
    this.setJournal([], STAGES[0])
  }

  /** Give a save made with the title-case name the current name and completion. */
  override refreshSavedText(): void {
    const current = new HintOfMagicQuest()
    this.name = current.name
    this.completion = current.completion
  }

  /** Given when Elior wakes from the dream in his cottage. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_WOKE_FROM_DREAM)
  }

  /**
   * Grow the log to the step the story flags have reached: lantern lit, then
   * journal read. Reports a change once per step; an older save, with no log
   * kept as data, is brought to its step the same way.
   */
  override checkUpdate(gameState: GameState): boolean {
    let reached = 1
    if (gameState.getStoryFlag(FLAG_LANTERN_LIT)) reached = 2
    if (gameState.getStoryFlag(FLAG_JOURNAL_READ)) reached = 3
    const latest = STAGES[reached - 1]
    if (this.latestStage === latest) return false
    this.setJournal(STAGES.slice(0, reached - 1), latest)
    return true
  }

  /**
   * Completed when the player has learned the 'revive' spell. Exits in
   * EliorsCottage are unlocked dynamically via getExits() once the spell is known.
   */
  override checkCompletion(gameState: GameState): boolean {
    return gameState.hasSpell('revive')
  }
}
