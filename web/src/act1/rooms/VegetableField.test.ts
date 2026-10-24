import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_VEGETABLE_FIELD_WATERED } from '../Act1StoryFlags'

describe('Vegetable Field room card', () => {
  it('shows the field recovered once it is watered', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VegetableField
    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    const text = new GameController(game).getRoomDescription()
    expect(text).toContain('Rows of green crops')
    expect(text).not.toContain('withered')
  })
})
