import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'

describe('Shiny Pebble', () => {
  it('does not glint in sunlight in the dark glade', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.HiddenGlade
    const text = executeCommands(game, ['examine pebble'])
    expect(text).not.toContain('sunlight')
    expect(text).toContain('glints')
  })
})
