import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { MemoryVault } from './MemoryVault'

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
