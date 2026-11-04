import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_VEGETABLE_FIELD_WATERED } from '../Act1StoryFlags'
import { VegetableField } from './VegetableField'

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

describe('Vegetable Field sound', () => {
  it('sounds withered until watered, then green', () => {
    const game = new Game([new Act1()])
    const field = game.state.allRooms.VegetableField
    expect(field.soundState(game.state)).toBe(VegetableField.SOUND_WITHERED)
    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    expect(field.soundState(game.state)).toBe(VegetableField.SOUND_GREEN)
  })
})

describe('Vegetable Field rusty hoe', () => {
  it('stops mentioning the rusty hoe once Elior has taken it, and again once it is dropped back', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VegetableField
    const controller = new GameController(game)
    expect(controller.getRoomDescription()).toContain('rusty hoe')
    game.commandParser.parse('take rusty hoe')
    expect(game.state.hasItem('Rusty Hoe')).toBe(true)
    const text = controller.getRoomDescription()
    expect(text).toContain('Rows of withered crops')
    expect(text).toContain('a few stubborn carrots')
    expect(text).not.toContain('hoe')
    game.commandParser.parse('drop rusty hoe')
    expect(controller.getRoomDescription()).toContain('rusty hoe')
  })
})
