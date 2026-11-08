import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { MemoryVault } from './MemoryVault'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import { executeCommands } from '@/testing/gameHelpers'

describe('MemoryVault', () => {
  it('has the correct name', () => {
    const room = new MemoryVault()
    expect(room.name).toBe('Memory Vault')
  })

  it('lists south and the door east, but offers only south at first', () => {
    const room = new MemoryVault()
    expect(room.exits).toEqual({
      south: 'ChamberOfWhispers',
      east: 'ParentsVault',
    })
    const game = new Game([new Act4()])
    expect(
      Object.keys(game.state.allRooms.MemoryVault.getExits(game.state)),
    ).toEqual(['south'])
  })
})

describe('Memory Vault once the door is open', () => {
  const TO_OPEN = ACT4_GOLDEN_PATH.slice(
    0,
    ACT4_GOLDEN_PATH.indexOf('use ancient amulet on door') + 1,
  )

  it('speaks of a sealed door until it opens, and an open one after', () => {
    const game = new Game([new Act4()])
    executeCommands(game, TO_OPEN.slice(0, -1))
    expect(game.state.currentRoom.describe(game.state)).toContain(
      'its eyes on the sealed door to the east.',
    )
    expect(executeCommands(game, ['examine door'])).toContain(
      'as if they are waiting.',
    )
    executeCommands(game, [TO_OPEN[TO_OPEN.length - 1]])
    const look = game.state.currentRoom.describe(game.state)
    expect(look).not.toContain('sealed door')
    expect(look).toContain('its eyes on the open door to the east.')
    const door = executeCommands(game, ['examine door'])
    expect(door).not.toContain('as if they are waiting')
    expect(door).toContain('The door stands open.')
    expect(game.loadSaveData(game.toSaveData())).toContain(
      'Game loaded successfully.',
    )
    expect(game.state.currentRoom.describe(game.state)).not.toContain(
      'sealed door',
    )
  })
})
