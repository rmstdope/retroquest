import { Item, type GameState } from '@/engine'
import { FLAG_READ_PHOTO_MESSAGE } from '../Act1StoryFlags'

/** Personal relic tying Elior to family backstory and exploration hints. */
export class FadedPhotograph extends Item {
  constructor() {
    super({
      name: 'faded photograph',
      shortName: 'photograph',
      description:
        'An old, faded photograph. The image is barely visible, but you can make out ' +
        "two adults and a child. On the back, in your mother's handwriting, is a " +
        'cryptic message: ' +
        '[character_name][/character_name][dialogue]Seek the truth where the river bends.[/dialogue]',
      canBeCarried: true,
    })
  }

  /** Set the story flag when the photograph is examined. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_READ_PHOTO_MESSAGE, true)
    return super.examine(gameState)
  }
}
