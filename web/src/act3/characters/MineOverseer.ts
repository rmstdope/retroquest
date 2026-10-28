import {
  Character,
  type GameState,
  characterName,
  speech,
  type NameOptions,
} from '@/engine'
import { MinersKey } from '../items/MinersKey'
import {
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_MINERS_RESCUE_STARTED,
} from '../Act3StoryFlags'

/** Overseer who triggers Miners' Rescue and gives the miner's key. */
export class MineOverseer extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'Mine Overseer',
      description:
        'A foreman in a coat grey with rock dust, a ring of keys at his ' +
        'belt. He keeps looking past you, into the dark.',
    })
  }

  /**
   * Plead for help and hand over the Miner's Key on the first talk; wait at
   * the arch while the miners are trapped, and count them home after.
   */
  override talkTo(gameState: GameState): string {
    const name = this.name
    if (!gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_STARTED)) {
      gameState.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_STARTED, true)
      // Give the miner's key if not already in inventory
      if (!gameState.inventory.some((i) => i instanceof MinersKey)) {
        gameState.inventory.push(new MinersKey())
      }
      return (
        'The ' +
        characterName(name) +
        ' grips your arm, voice hoarse: ' +
        speech(
          'The roof came down at dawn. Half a dozen men are trapped behind ' +
            'it. We dug, and the walls groaned at every blow, so we stopped. ' +
            "The young ones shouted for hours. Now there's nothing. Gods, let " +
            'them still be alive.',
        ) +
        '\n' +
        'He points north, jaw clenched: ' +
        speech(
          'The Tool Cache is up there: braces, straps, wedge blocks. The ' +
            'Collapsed Galleries are past it, east. Brace the roof before you ' +
            'touch the rock, or it comes down on you.',
        ) +
        '\n' +
        'He presses a heavy iron key into your palm, his hand trembling: ' +
        speech(
          'Here—take my key. ' +
            'It opens the supply crate. Get those miners out.',
        ) +
        '\n' +
        "You receive the [item_name]miner's key[/item_name]."
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)) {
      return (
        'The ' +
        characterName(name) +
        ' counts heads under his breath, and gets the same number twice. ' +
        speech('All of them. Even the boy.') +
        ' He lets go of the arch at last.'
      )
    }
    return (
      'The ' +
      characterName(name) +
      ' has not moved from the arch. ' +
      speech('Still nothing from the galleries. The Tool Cache is north.')
    )
  }
}
