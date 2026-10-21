import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_FOUND_LOST_CARAVAN } from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const EXAMINE =
  'A young caravan guard sits on a crate by the door, one hand wrapped in a dirty bandage. ' +
  'He jumps whenever someone comes in, as if he expects to be thrown out.'
const STEP_1 =
  "You've seen Thorne, then. You'll have heard. The path just went, out from under the wagons. " +
  'I was hanging over the ravine by one hand. When I got up I ran for help, I swear I did. ' +
  "But the forest turned me round, and I couldn't find the road again for two days. " +
  'So I came back. Somebody had to tell him.'
const STEP_2 =
  "They're home? All of them? … Thank you. Thorne says I'm to have my wages and not a copper more. " +
  "I suppose that's fair. I ran. Unless somebody told him what it was like out there. " +
  "He'd never hear it from me."
const STEP_3 =
  "Thorne says one more road. He says somebody spoke for me. … I won't run again. Not this time."

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
    expect(game.commandParser.parse('examine brenn')).toContain(EXAMINE)
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

  it('stays on step 1 when Thorne is asked to forgive before the documents', () => {
    const game = gameAtBrenn()
    game.state.currentRoom = game.state.allRooms.MarketDistrict
    game.commandParser.parse('say forgive to thorne')
    game.state.currentRoom = game.state.allRooms.MerchantsWarehouse

    expect(game.commandParser.parse('talk to brenn')).toContain(STEP_1)
  })

  it('appears in the warehouse of a save made before he was added', () => {
    const game = gameAtBrenn()
    game.state.allRooms.MerchantsWarehouse.characters = []
    const fresh = new Game([new Act2()])

    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(
      fresh.state.allRooms.MerchantsWarehouse.characters.map((c) => c.name),
    ).toEqual(['brenn'])
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
