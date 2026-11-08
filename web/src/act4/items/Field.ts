import { Item, type GameState } from '@/engine'
import { FLAG_ACT4_FIELD_GREEN } from '../Act4StoryFlags'

/** The field before grow is cast on it. */
const WITHERED =
  'Row after row of withered crops, the earth between them cracked and ' +
  'grey. You have worked these rows since you could walk.'

/** The field once grow has greened it. */
const GREEN =
  'Green rows under a pale sky, the earth dark and soft between them.'

/**
 * The withered field behind Elior's home in Willowbrook Field, the last room
 * of the game. Its look follows whether grow has greened it; grow cast on it
 * is the last cast of the story (see `Grow`).
 */
export class Field extends Item {
  constructor() {
    super({
      name: 'Field',
      description: WITHERED,
      canBeCarried: false,
    })
  }

  /** The player may also say "crops". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'crops'
  }

  /** Withered until grow is cast, green after. */
  override examine(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_ACT4_FIELD_GREEN) ? GREEN : WITHERED
  }
}
