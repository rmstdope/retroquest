import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_ECHOES_QUEST_STARTED } from '../Act3StoryFlags'

/** A note from Mira referencing Elior's parents and hinting at hidden truths. */
export class KeepsakeNote extends Item {
  constructor() {
    super({
      name: 'Keepsake Note',
      description:
        "A small, worn piece of parchment in Mira's careful handwriting. " +
        'The note seems to carry the weight of long-held secrets, and ' +
        'mentions fragments of truth scattered across the relic sites.',
      canBeCarried: true,
      shortName: 'note',
    })
  }

  /** Read the note's contents. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED)) {
      gameState.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    }

    return (
      "[event]You unfold the note carefully, reading Mira's words:[/event]\n\n" +
      "[dim]'Elior, as you journey to the relic sites, keep your eyes " +
      'open for traces of the past. Your parents left marks upon this ' +
      'world—fragments of their story that Malakar could not erase. In ' +
      'the depths where courage is tested, on the heights where wisdom ' +
      'burns, and in the shadows where sacrifice echoes, you may find ' +
      'the truth of how they hid you from his sight. The three testimonies ' +
      "will reveal what love can accomplish against the darkest power.'[/dim]\n\n" +
      '[event]The note fills you with a sense of purpose beyond the ' +
      'immediate quest. Somewhere in each relic site, pieces of your ' +
      'heritage await discovery.[/event]'
    )
  }
}
