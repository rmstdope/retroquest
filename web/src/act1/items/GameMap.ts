import { Item, type GameState } from '@/engine'
import { FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED } from '../Act1StoryFlags'

/**
 * Player-held world map enabling Act I completion in the correct context.
 * (Python class `Map`; named `GameMap` here so it does not shadow the global `Map`.)
 */
export class GameMap extends Item {
  constructor() {
    super({
      name: 'map',
      description:
        'A detailed map of Willowbrook and the surrounding areas. It shows various ' +
        'landmarks and paths, some of which are not immediately obvious.',
      canBeCarried: true,
    })
  }

  /** Returns a contextual description; may set the act completion flag. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom.name.toLowerCase() === 'road to greendale') {
      gameState.setStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED, true)
      return (
        `[event]You use the [item_name]${this.name}[/item_name].[/event]\n` +
        `The [item_name]${this.name}[/item_name] aligns with the landscape,` +
        ' revealing a ' +
        'hidden path that shortens the journey to Greendale. You feel a sense of ' +
        'accomplishment as you set forth.'
      )
    }
    return (
      `[event]You study the [item_name]${this.name}[/item_name]. It depicts the ` +
      'local area with surprising detail.[/event]'
    )
  }
}
