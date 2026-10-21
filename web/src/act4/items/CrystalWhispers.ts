import { Item, type GameState, event } from '@/engine'
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

  /** The crystals fall silent once the Sorceress is redeemed. */
  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)) {
      return event('The crystals are silent now.')
    }
    return event(this.description)
  }
}
