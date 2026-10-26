import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import {
  ACT2_COMPLETING_COMMANDS,
  ACT2_GOLDEN_PATH,
} from '@/act2/Act2GoldenPath'
import { ACT3_GOLDEN_PATH } from '@/act3/Act3GoldenPath'
import {
  executeCommands,
  expectItemInInventory,
  pathIndex,
} from './gameHelpers'

/**
 * An act started a second time in one game, after a save of the act before
 * it is loaded. This test lives here because it crosses two acts, which share
 * no code.
 */

/** Finish Act II from Sir Cedric waiting and turn until Act III runs. */
function finishActTwo(game: Game): void {
  executeCommands(game, ACT2_COMPLETING_COMMANDS)
  for (let turn = 0; turn < 10; turn++) {
    if (game.currentAct === 1 && game.isActRunning()) return
    game.newTurn()
  }
  throw new Error('Act III never started')
}

/** The names of what lies in the Tidal Causeway. */
function causewayItems(game: Game): string[] {
  return game.state.allRooms.TidalCauseway.items.map((item) => item.name)
}

/** The names of what Elior carries. */
function inventoryItems(game: Game): string[] {
  return game.state.inventory.map((item) => item.name)
}

describe('Act III after loading an Act II save in the same game', () => {
  it('starts fresh, with the letter behind the mural again', () => {
    const game = new Game([new Act2(), new Act3()])
    executeCommands(game, ACT2_GOLDEN_PATH)
    const actTwoSave = game.toSaveData()
    finishActTwo(game)
    const freshCauseway = causewayItems(game)
    const freshInventory = inventoryItems(game)
    executeCommands(
      game,
      ACT3_GOLDEN_PATH.slice(0, pathIndex(ACT3_GOLDEN_PATH, 'n')),
    )

    expect(game.loadSaveData(actTwoSave)).toContain('loaded')
    finishActTwo(game)

    expect(causewayItems(game)).toEqual(freshCauseway)
    expect(inventoryItems(game)).toEqual(freshInventory)
    executeCommands(
      game,
      ACT3_GOLDEN_PATH.slice(0, pathIndex(ACT3_GOLDEN_PATH, 'take letter') + 1),
    )
    expectItemInInventory(game.state, 'Sea-Sealed Letter')
  })
})
