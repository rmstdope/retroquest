import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { Bread } from './Bread'

describe('Bread and the chickens', () => {
  it('shakes the key loose from the rafter the coop describes', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.ChickenCoop
    game.state.addItemToInventory(new Bread())

    const answer = game.commandParser.parse('use bread with chicken')

    expect(game.state.currentRoom.description).toContain('rafter')
    expect(game.state.currentRoom.description).not.toContain('straw, hinting')
    expect(answer).toContain('rafter')
    expect(answer).toContain('hidden')
    expect(findMarkupProblems(answer)).toEqual([])
  })
})
