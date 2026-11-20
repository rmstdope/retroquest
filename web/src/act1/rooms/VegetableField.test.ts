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
    expect(text).toContain('beneath an open sky')
    expect(text).not.toContain('withered')
  })
})

describe('Vegetable Field weather', () => {
  const STORM_SKY =
    "Rows of withered crops stretch beneath the last grey of the night's storm."

  it('is grey from the storm while withered, with and without the hoe', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VegetableField
    const controller = new GameController(game)
    expect(controller.getRoomDescription()).toContain(STORM_SKY)
    game.commandParser.parse('take rusty hoe')
    expect(controller.getRoomDescription()).toContain(STORM_SKY)
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

describe('Vegetable Field rusty trowel', () => {
  it('stops mentioning the rusty trowel once Elior has taken it', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VegetableField
    const controller = new GameController(game)
    expect(controller.getRoomDescription()).toContain(
      'a few stubborn carrots and a rusty trowel hinting at better days.',
    )
    game.commandParser.parse('take rusty trowel')
    expect(game.state.hasItem('Rusty Trowel')).toBe(true)
    const text = controller.getRoomDescription()
    expect(text).toContain('Rows of withered crops')
    expect(text).toContain('a few stubborn carrots')
    expect(text).not.toContain('trowel')
  })
})
