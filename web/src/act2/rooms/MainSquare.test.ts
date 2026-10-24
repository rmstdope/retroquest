import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { MainSquare } from './MainSquare'

/** A save in which Main Square and the story flags still hold the old map gate. */
function oldGateSave(): string {
  const game = new Game([new Act2()])
  Object.assign(game.state.allRooms.MainSquare, { cityMapUsed: false })
  game.state.setStoryFlag('used_city_map', false)
  return game.toSaveData()
}

describe('MainSquare', () => {
  it('opens north, east and south from the start, with no map', () => {
    const game = new Game([new Act2()])
    const square = game.state.allRooms.MainSquare
    expect(square).toBeInstanceOf(MainSquare)
    expect(square.getExits(game.state)).toEqual({
      south: 'GreendaleGates',
      north: 'CastleApproach',
      east: 'MarketDistrict',
    })
  })

  it('lets a player in an older save that recorded the map gate go north and east', () => {
    const data = oldGateSave()
    expect(data).toContain('cityMapUsed')
    expect(data).toContain('used_city_map')

    const game = new Game([new Act2()])
    expect(game.loadSaveData(data)).toContain('loaded successfully')
    game.state.currentRoom = game.state.allRooms.MainSquare
    game.move('north')
    expect(game.state.currentRoom).not.toBe(game.state.allRooms.MainSquare)
    game.state.currentRoom = game.state.allRooms.MainSquare
    game.move('east')
    expect(game.state.currentRoom).not.toBe(game.state.allRooms.MainSquare)
  })
})
