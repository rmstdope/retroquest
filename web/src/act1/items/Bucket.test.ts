import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'
import { FLAG_VEGETABLE_FIELD_WATERED } from '../Act1StoryFlags'
import { Act1 } from '../Act1'
import { Bucket } from './Bucket'
import { Well } from './Well'

describe('Bucket', () => {
  it('draws murky, sour water from the unpurified well', () => {
    const game = new Game([new Act1()])
    const bucket = new Bucket()

    const answer = bucket.useWith(game.state, new Well())

    expect(answer).toContain('murky')
    expect(answer).toContain('sour smell')
    expect(answer).not.toContain('clear water')
    expect(bucket.description).toContain('murky')
  })

  it('draws clear water once the well is purified', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    well.isPurified = true
    const bucket = new Bucket()

    const answer = bucket.useWith(game.state, well)

    expect(answer).toContain('clear water')
    expect(bucket.description).toContain('clear water')
  })

  it('swaps murky water for clear once the well is purified', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    const bucket = new Bucket()
    bucket.useWith(game.state, well)
    well.isPurified = true

    const answer = bucket.useWith(game.state, well)

    expect(answer).toContain('clear water')
    expect(answer).not.toContain('[failure]')
    expect(bucket.description).toContain('clear water')
    expect(bucket.useWith(game.state, well)).toContain('already full')
  })
})

describe('Watering the Vegetable Field', () => {
  /** A game in the Vegetable Field holding a bucket drawn from the well. */
  function gameInTheField(purified: boolean): { game: Game; bucket: Bucket } {
    const game = new Game([new Act1()])
    const well = new Well()
    well.isPurified = purified
    const bucket = new Bucket()
    bucket.useWith(game.state, well)
    game.state.addItemToInventory(bucket)
    game.state.currentRoom = game.state.allRooms.VegetableField
    return { game, bucket }
  }

  it('makes the whole field recover with purified water', () => {
    const { game, bucket } = gameInTheField(true)
    const before = game.state.currentRoom.describe(game.state)

    const response = executeCommands(game, ['use bucket'])

    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(true)
    expectMarkupWellFormed(response)
    expect(bucket.name).toBe('bucket')
    const after = game.state.currentRoom.describe(game.state)
    expect(after).not.toBe(before)
    expect(after).not.toContain('withered crops')
    expect(after).toContain('green')
  })

  it('also waters the field when used with the carrot', () => {
    const { game } = gameInTheField(true)

    executeCommands(game, ['use bucket with carrot'])

    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(true)
  })

  it('refuses to pour the sour water on the field', () => {
    const { game, bucket } = gameInTheField(false)

    const response = executeCommands(game, ['use bucket'])

    expect(response).toContain('[failure]')
    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(false)
    expect(bucket.name).toBe('bucket (full)')
  })
})
