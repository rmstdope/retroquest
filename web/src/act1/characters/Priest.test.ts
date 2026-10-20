import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_PRIEST_TALKED_TO } from '../Act1StoryFlags'

describe('Priest dialogue', () => {
  it('asks Elior to get matches from the General Store', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageChapel

    const response = game.commandParser.parse('talk to priest')

    expect(response).toContain('out of matches')
    expect(response).toContain('General Store')
    expect(game.state.getStoryFlag(FLAG_PRIEST_TALKED_TO)).toBe(true)
  })
})
