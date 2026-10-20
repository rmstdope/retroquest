import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
} from '../Act1StoryFlags'

describe('Mira’s early guidance', () => {
  it('points Elior toward the Rare Flower, the well and the Hidden Glade', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.MirasHut
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)

    const response = game.commandParser.parse('talk to mira')

    expect(response).toContain('Rare Flower')
    expect(response).toContain('Hidden Glade')
    expect(response).toContain('well')
    expect(game.state.getStoryFlag(FLAG_CONNECT_WITH_NATURE)).toBe(true)
  })
})
