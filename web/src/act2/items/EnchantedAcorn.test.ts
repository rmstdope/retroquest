import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { EnchantedAcorn } from './EnchantedAcorn'

describe('EnchantedAcorn tells the grove by what it is, not by its name', () => {
  it.each([
    ['AncientGrove', 'turns in your palm toward the silver-barked tree'],
    ['ForestEntrance', 'lies warm and still in your hand'],
  ])('answers the same in a renamed %s', (key, expected) => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms[key]
    game.state.currentRoom.name = 'Somewhere Else'

    expect(new EnchantedAcorn().use(game.state)).toContain(expected)
  })
})
