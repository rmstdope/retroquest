import { Item, type GameState, writing } from '@/engine'
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
        writing('Seek the truth where the river bends.'),
      canBeCarried: true,
    })
  }

  /** Set the story flag when the photograph is examined. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_READ_PHOTO_MESSAGE, true)
    return super.examine(gameState)
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'You hold it by the edges so as not to smudge the faces. ' +
      'The child in it is you, though you do not remember the day.'
    )
  }
}
