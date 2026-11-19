import { Item, type GameState, writing } from '@/engine'
import { FLAG_READ_PHOTO_MESSAGE } from '../Act1StoryFlags'

/** The photograph once Elior has turned it over and read its back. */
const TURNED_OVER =
  'An old, faded photograph. The image is barely visible, but you can make out ' +
  "two adults and a child. On the back, in your mother's handwriting, is a " +
  'cryptic message: ' +
  writing('Seek the truth where the river bends.')

/** The photograph before its back has been read: the message stays unseen. */
const FRONT_ONLY =
  'An old, faded photograph. The image is barely visible, but you can make out ' +
  'two adults and a child. Something is written on the back.'

/** Personal relic tying Elior to family backstory and exploration hints. */
export class FadedPhotograph extends Item {
  constructor() {
    super({
      name: 'faded photograph',
      shortName: 'photograph',
      description: TURNED_OVER,
      canBeCarried: true,
    })
  }

  /**
   * The photograph's front until it has been examined, and its back's
   * message after, so the Bag never shows a line the story counts as unread.
   */
  override descriptionFor(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_READ_PHOTO_MESSAGE)
      ? TURNED_OVER
      : FRONT_ONLY
  }

  /** Set the story flag when the photograph is examined, then show its back. */
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
