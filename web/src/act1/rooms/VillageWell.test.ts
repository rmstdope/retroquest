import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { Well } from '../items/Well'
import { executeCommands } from '@/testing/gameHelpers'

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

describe('Village Well, a low well around a deep pool', () => {
  it('is no higher than a knee, and the pool stays out of reach', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageWell
    const room = new GameController(game).getRoomDescription()
    expect(room).toContain(
      'An old stone well sits low in the grass between the field and the ' +
        'forge, a ring of stones worn smooth by countless hands around a ' +
        'deep pool.',
    )
    expect(room).toContain('Moss creeps over the stones.')
    const look = executeCommands(game, ['examine well'])
    expect(look).toContain(
      'An old stone well, no higher than your knee, around water that goes ' +
        'down further than you can see.',
    )
    expect(look).toContain('It is much too deep to reach.')
  })
})
