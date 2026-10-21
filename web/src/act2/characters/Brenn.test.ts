import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_FOUND_LOST_CARAVAN } from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const STEP_1 = 'The path just went, out from under the wagons.'
const STEP_2 = "They're home? All of them?"
const STEP_3 = "I won't run again. Not this time."

/** An Act II game standing in the Merchant's Warehouse. */
function gameAtBrenn(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.MerchantsWarehouse
  return game
}

/** Walk to Thorne, take the rescue reward, and come back to the warehouse. */
function rescue(game: Game): void {
  game.state.currentRoom = game.state.allRooms.MarketDistrict
  game.state.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)
  game.commandParser.parse('talk to caravan master thorne')
  game.state.currentRoom = game.state.allRooms.MerchantsWarehouse
}

describe('Brenn', () => {
  it('is listed in the warehouse and has an examine text', () => {
    const game = gameAtBrenn()

    expect(
      game.state.allRooms.MerchantsWarehouse.characters.map((c) => c.name),
    ).toEqual(['brenn'])
    expect(game.commandParser.parse('examine brenn')).toContain(
      'A young caravan guard sits on a crate by the door, one hand wrapped in a dirty bandage.',
    )
  })

  it('tells his side of the story before the rescue, every time', () => {
    const game = gameAtBrenn()

    const first = game.commandParser.parse('talk to brenn')
    const second = game.commandParser.parse('talk to brenn')

    expect(first).toContain(STEP_1)
    expect(second).toBe(first)
    expectMarkupWellFormed(first)
    expectDialogueSpeaker(first, 'brenn')
  })

  it('stays on step 1 while the caravan is found but the documents not handed over', () => {
    const game = gameAtBrenn()
    game.state.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)

    expect(game.commandParser.parse('talk to brenn')).toContain(STEP_1)
  })

  it('thanks Elior and hints after the rescue, without naming the command', () => {
    const game = gameAtBrenn()
    rescue(game)

    const first = game.commandParser.parse('talk to brenn')
    const second = game.commandParser.parse('talk to brenn')

    expect(first).toContain(STEP_2)
    expect(first).not.toContain('forgive')
    expect(second).toBe(first)
    expectDialogueSpeaker(first, 'brenn')
  })

  it('promises not to run again once Elior has spoken for him', () => {
    const game = gameAtBrenn()
    rescue(game)
    game.state.currentRoom = game.state.allRooms.MarketDistrict
    game.commandParser.parse('say forgive to thorne')
    game.state.currentRoom = game.state.allRooms.MerchantsWarehouse

    const answer = game.commandParser.parse('talk to brenn')

    expect(answer).toContain(STEP_3)
    expect(game.state.allRooms.MerchantsWarehouse.characters).toHaveLength(1)
  })

  it('has nothing to say to other words', () => {
    const game = gameAtBrenn()

    expect(game.commandParser.parse('say forgive to brenn')).toContain(
      "don't seem to understand",
    )
  })

  it('keeps the step he had reached across a save and load', () => {
    const game = gameAtBrenn()
    rescue(game)
    const fresh = new Game([new Act2()])

    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(fresh.state.currentRoom.name).toBe("Merchant's Warehouse")
    expect(fresh.commandParser.parse('talk to brenn')).toContain(STEP_2)
  })
})
