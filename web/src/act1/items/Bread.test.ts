import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { Bread } from './Bread'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'
import { executeCommands } from '@/testing/gameHelpers'

/** A new Act I game already woken out of the dream, standing in the cottage. */
function cottageGame(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.EliorsCottage
  return game
}

describe('Bread and the chickens', () => {
  it('shakes the key loose from the rafter the coop describes', () => {
    const game = cottageGame()
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

describe("Bread and grandmother's fresh loaf", () => {
  it('still feeds the chickens when the fresh loaf is carried too', () => {
    const game = cottageGame()
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    executeCommands(game, ['talk to grandmother', 'use lantern', 'take bread'])
    expect(game.state.hasItem('fresh bread')).toBe(true)
    game.state.currentRoom = game.state.allRooms.ChickenCoop

    const answer = game.commandParser.parse('use bread with chicken')

    expect(answer).toContain('[item_name]small key[/item_name]')
    expect(game.state.hasItem('fresh bread')).toBe(true)
  })
})
