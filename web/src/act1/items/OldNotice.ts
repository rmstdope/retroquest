import { Item, type GameState, characterName, writing } from '@/engine'
import { FLAG_READ_HEMLOCK_NOTICE } from '../Act1StoryFlags'

const NOTICE_DESCRIPTION =
  'A faded piece of parchment pinned to the notice board. ' +
  'The ink has run, but you can make out the words:'

/** Faded missing-cat poster pinned to the notice board: Hemlock's plea for Patches. */
export class OldNotice extends Item {
  constructor() {
    super({
      name: 'old notice',
      description: NOTICE_DESCRIPTION,
      shortName: 'notice',
    })
  }

  /**
   * Show the description, then the poster's own words as unsigned writing.
   * Reading it is how Elior hears of Patches and the reward.
   */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_READ_HEMLOCK_NOTICE, true)
    return (
      `${this.descriptionFor(gameState)}\n` +
      writing(
        `[bold]MISSING[/bold] - Our dear cat, ${characterName('Patches')}, has vanished. ` +
          'Last seen near the old well. ' +
          'She is very friendly but easily spooked. Responds to her name. ' +
          `If found, please return to the ${characterName('Hemlock')} family ` +
          'at the General Store. ' +
          'A small reward is offered.',
      )
    )
  }

  /** The notice's look: always the current wording, even for an older save. */
  override descriptionFor(_gameState: GameState): string {
    return NOTICE_DESCRIPTION
  }
}
