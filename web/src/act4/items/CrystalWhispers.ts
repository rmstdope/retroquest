import { Item, type GameState } from '@/engine'
import { FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED } from '../Act4StoryFlags'

/**
 * The whispering crystals of the Chamber of Whispers: scenery that Heart's
 * Truth hears through. Named "Whispers" like the voices on the tower stair,
 * which are a character in another room.
 */
export class CrystalWhispers extends Item {
  constructor() {
    super({
      name: 'Whispers',
      description:
        'You lean close to a crystal. The whispers speak of what you want ' +
        'most and fear most, and the longer you listen the more they sound ' +
        'alike.',
      canBeCarried: false,
    })
  }

  /** Also answers to "whisper" and "crystals". */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['whisper', 'crystals'].includes(name.toLowerCase())
    )
  }

  /** Listening with the ears alone hears the lies, not what is under them; silence once she is redeemed. */
  override listen(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return 'The crystals are silent now.'
    }
    return (
      'Kind, untrue things, over and over, in a voice that is almost hers. ' +
      'Whatever is under them is too quiet for ears alone.'
    )
  }

  /** The crystals fall silent once the Sorceress is redeemed. */
  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return 'The crystals are silent now.'
    }
    return this.description
  }
}
