import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { BrokenShovel } from './BrokenShovel'
import { MothersLetter } from './MothersLetter'
import {
  FLAG_FISHERMAN_TOLD_OF_TIN,
  FLAG_FOUND_MOTHERS_LETTER,
} from '../Act1StoryFlags'

/** How many mother's letters lie at the Riverbank. */
function lettersInRoom(game: Game): number {
  return game.state.allRooms.Riverbank.items.filter(
    (item) => item instanceof MothersLetter,
  ).length
}

describe('SmoothStone', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.Riverbank
    game.state.addItemToInventory(new BrokenShovel())
  })

  describe('before the fisherman has told of the tin', () => {
    it('is lifted and set back when taken, and nothing is found', () => {
      const response = executeCommands(game, ['take smooth stone'])

      expect(response).toContain('set it back')
      expect(game.state.getStoryFlag(FLAG_FOUND_MOTHERS_LETTER)).toBe(false)
      expect(lettersInRoom(game)).toBe(0)
    })

    it('turns up nothing when the shovel is used with it', () => {
      const response = executeCommands(game, [
        'use broken shovel with smooth stone',
      ])

      expect(response).toContain("can't use")

      expect(game.state.getStoryFlag(FLAG_FOUND_MOTHERS_LETTER)).toBe(false)
      expect(lettersInRoom(game)).toBe(0)
    })
  })

  describe('after the fisherman has told of the tin', () => {
    beforeEach(() => {
      game.state.setStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN, true)
    })

    it('finds the tin when the stone is taken', () => {
      const response = executeCommands(game, ['take smooth stone'])

      expect(response).toContain('small tin')
      expect(game.state.getStoryFlag(FLAG_FOUND_MOTHERS_LETTER)).toBe(true)
      expect(lettersInRoom(game)).toBe(1)
    })

    it('finds the tin when the shovel is used with the stone', () => {
      const response = executeCommands(game, [
        'use broken shovel with smooth stone',
      ])

      expect(response).toContain('small tin')
      expect(game.state.getStoryFlag(FLAG_FOUND_MOTHERS_LETTER)).toBe(true)
      expect(lettersInRoom(game)).toBe(1)
    })

    it('finds the tin only once, however it is looked for', () => {
      executeCommands(game, [
        'take smooth stone',
        'use broken shovel with smooth stone',
        'search',
        'take smooth stone',
      ])

      expect(lettersInRoom(game)).toBe(1)
    })

    it('is no longer described as never moved once the tin is dug out', () => {
      const before = executeCommands(game, ['examine smooth stone'])
      expect(before).toContain('as if it has always been there')

      const after = executeCommands(game, [
        'take smooth stone',
        'examine smooth stone',
      ])

      expect(after).not.toContain('as if it has always been there')
      expect(after).toContain('dug')
    })

    it('stays at the bend after the tin is found', () => {
      const response = executeCommands(game, ['search', 'take smooth stone'])

      expect(response).toContain('set it back')
      expect(game.state.allRooms.Riverbank.items.map((i) => i.name)).toContain(
        'smooth stone',
      )
    })
  })
})
