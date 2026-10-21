import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_PARENTS_LEGACY_COMPLETED } from '../Act4StoryFlags'

describe('ParentsVault', () => {
  it('lists west always and north only once the memories are seen', () => {
    const game = new Game([new Act4()])
    const room = game.state.allRooms.ParentsVault
    expect(room.name).toBe("Parents' Vault")
    expect(Object.keys(room.getExits(game.state))).toEqual(['west'])
    game.state.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED, true)
    expect(room.getExits(game.state)).toEqual({
      west: 'MemoryVault',
      north: 'ThroneChamber',
    })
  })
})
