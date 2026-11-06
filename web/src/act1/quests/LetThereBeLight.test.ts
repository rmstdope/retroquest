import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'
import { Matches } from '../items/Matches'

const QUEST = 'Let there be light'

describe('Let there be light', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageChapel
  })

  /** The active quest's log as the hint and the quest log read it. */
  function quest(): { description: string; hint: string | null } {
    const found = game.state.activatedQuests.find((q) => q.name === QUEST)
    if (!found) throw new Error(`${QUEST} is not active`)
    return { description: found.description, hint: found.hint(game.state) }
  }

  it('sends Elior to Hemlock while the matches are still at the store', () => {
    executeCommands(game, ['talk to priest'])
    expect(quest().hint).toContain('General Store')
  })

  it('leads to the cold candle, not to Hemlock, once the matches are in hand', () => {
    executeCommands(game, ['talk to priest'])
    game.state.addItemToInventory(new Matches())
    executeCommands(game, ['look'])

    expect(quest().hint).not.toContain('General Store')
    expect(quest().hint).toContain('candle')
  })

  it('keeps the matches stage through a save and load', () => {
    executeCommands(game, ['talk to priest'])
    game.state.addItemToInventory(new Matches())
    executeCommands(game, ['look'])

    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())
    const saved = loaded.state.activatedQuests.find((q) => q.name === QUEST)
    expect(saved?.hint(loaded.state)).not.toContain('General Store')
  })
})
