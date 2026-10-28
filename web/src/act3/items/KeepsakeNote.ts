import { Item, type GameState, characterName, writing } from '@/engine'
import { FLAG_ACT3_ECHOES_QUEST_STARTED } from '../Act3StoryFlags'

/** A note from Mira telling Elior to read what the relics' makers left behind. */
export class KeepsakeNote extends Item {
  constructor() {
    super({
      name: 'Keepsake Note',
      description:
        'A small, worn piece of parchment, folded twice, in ' +
        `${characterName('Mira')}'s careful hand.`,
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
      writing(
        'Elior. The people who made the relics left words behind them: by ' +
          'the sea, on the mountain and under the hills. Keep your eyes open ' +
          'for traces of the past. Read what they left, all of it, before ' +
          'you judge anyone.',
      ) +
      '\n\n' +
      'She has underlined the last line twice.'
    )
  }
}
