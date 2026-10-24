import { Character, type GameState, characterName, speech } from '@/engine'
import { MinersKey } from '../items/MinersKey'
import { FLAG_ACT3_MINERS_RESCUE_STARTED } from '../Act3StoryFlags'

/** Overseer who triggers Miners' Rescue and gives the miner's key. */
export class MineOverseer extends Character {
  constructor() {
    super({
      name: 'Mine Overseer',
      description: 'A grizzled foreman with a ring of keys and a worried look.',
    })
  }

  /** Plead for help and hand over the Miner's Key on the first talk. */
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
          "You don't hear them now, but the rock shifted at dawn. Half a " +
            'dozen men are trapped behind tons of stone—no air, no light. We tried to ' +
            'dig, but the walls groan with every blow. Some of the younger lads... they ' +
            'screamed until their voices gave out. The rest are silent now. Gods, let ' +
            'them still be alive.',
        ) +
        '\n' +
        'He points north, jaw clenched: ' +
        speech(
          'Collapsed Galleries are blocked, ' +
            'but the Tool Cache has what you need—braces, straps, blocks. If you can ' +
            'reach them, you might hold the roof long enough to pull the miners ' +
            'free.',
        ) +
        '\n' +
        'He presses a heavy iron key into your palm, his hand trembling: ' +
        speech(
          'Here—take my key. ' +
            'It opens the supply crate. Get those miners out.',
        ) +
        '\n' +
        "You receive the [item_name]Miner's Key[/item_name]."
      )
    }
    return (
      'The ' +
      characterName(name) +
      ' nods grimly. ' +
      speech('The miners ' + 'are still waiting. The Tool Cache is north.')
    )
  }
}
