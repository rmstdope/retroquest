import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_OATH_SCROLLS_EXAMINED } from '../Act3StoryFlags'

/** Ancient scrolls holding the old oath form with one blank to fill. */
export class OldOathScrolls extends Item {
  constructor() {
    super({
      name: 'Old Oath Scrolls',
      description:
        'Brittle parchment bound with faded golden thread. Most of the ' +
        'script has flaked away. One line survives, written in many hands, ' +
        'one beneath another: [italic]“I take what is given, and I return ' +
        '___.”[/italic] Each hand finished it with a word of its own, and ' +
        'every one of those words has worn away.',
      canBeCarried: true,
      shortName: 'scrolls',
    })
  }

  /**
   * Examine the oath scrolls and set the examined flag. The scrolls stay
   * where they are and always show the same text.
   */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
    return super.examine(gameState)
  }
}
