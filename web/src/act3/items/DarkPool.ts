import { Item, event, type GameState } from '@/engine'
import { FLAG_ACT3_POOLS_STILLED } from '../Act3StoryFlags'
import { StillwaterPhial } from './StillwaterPhial'

/** The obsidian pools of the Stillness Vestibule; whether they are stilled is a story flag. */
export class DarkPool extends Item {
  constructor() {
    super({
      name: 'dark pool',
      shortName: 'pool',
      description: 'Obsidian water, so still it seems frozen.',
      canBeCarried: false,
    })
  }

  /** The room text and the chant speak of "pools", so both spellings name this item. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'pools'
  }

  /** Examine the pool: a faint tremor before it is stilled, perfect stillness after. */
  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_POOLS_STILLED)) {
      return event(
        'The water lies flat as glass, holding the stones and the dark ' +
          'above in perfect reflection. Not a tremor crosses it.',
      )
    }
    return event(
      'Obsidian water, so still it seems frozen. Yet when you lean close, ' +
        'the faintest tremor runs across it, too fine to see unless you ' +
        'are looking for it.',
    )
  }

  /** Using the Stillwater Phial with the pool stills it. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof StillwaterPhial) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
