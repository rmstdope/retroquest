import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { Well } from '../items/Well'

describe('Village Well room card', () => {
  it('shows clear water once the well is purified', () => {
    const game = new Game([new Act1()])
    const room = game.state.allRooms.VillageWell
    game.state.currentRoom = room
    const well = room.items.find((item) => item instanceof Well)
    if (!(well instanceof Well)) throw new Error('no well')
    well.isPurified = true
    const text = new GameController(game).getRoomDescription()
    expect(text).toContain('crystalline clarity')
    expect(text).not.toContain('sour smell')
  })
})
