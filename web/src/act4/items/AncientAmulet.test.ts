import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { executeCommands } from '@/testing/gameHelpers'

describe('AncientAmulet', () => {
  it('is carried from the first turn and shows the picture Act III left', () => {
    const game = new Game([new Act4()])
    expect(game.state.hasItem('ancient amulet')).toBe(true)
    expect(executeCommands(game, ['examine amulet'])).toContain(
      'In its depths Aren and Lysa stand hand in hand. The third figure keeps his back turned.',
    )
  })

  it('works with the door either way round', () => {
    const game = new Game([new Act4()])
    game.state.currentRoom = game.state.allRooms.MemoryVault
    expect(executeCommands(game, ['use door with amulet'])).toContain(
      'runes stay dark',
    )
    expect(executeCommands(game, ['use amulet with door'])).toContain(
      'runes stay dark',
    )
  })
})
