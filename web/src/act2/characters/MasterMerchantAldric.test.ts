import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { MerchantsFlyer } from '../items/MerchantsFlyer'
import { WalkingStick } from '../items/WalkingStick'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'Master Merchant Aldric'

/** An Act II game with the player in the Market District. */
function createGameAtMarket(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.MarketDistrict
  return game
}

/** The answer is well formed and Aldric speaks every dialogue. */
function expectAldricSpeaks(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

describe('Master Merchant Aldric dialogue markup', () => {
  it('attributes the talk before the flyer to Aldric', () => {
    const game = createGameAtMarket()

    const answer = game.commandParser.parse('talk to master merchant aldric')

    expect(answer).toContain('I deal only with established customers')
    expectAldricSpeaks(answer)
  })

  it('attributes giving the flyer to Aldric', () => {
    const game = createGameAtMarket()
    game.state.addItemToInventory(new MerchantsFlyer())

    const answer = game.commandParser.parse(
      "give merchant's flyer to master merchant aldric",
    )

    expect(answer).toContain(
      'This flyer grants you access to our premium selection',
    )
    expectAldricSpeaks(answer)
  })

  it('attributes the talk after the flyer to Aldric', () => {
    const game = createGameAtMarket()
    game.state.addItemToInventory(new MerchantsFlyer())
    game.commandParser.parse("give merchant's flyer to master merchant aldric")

    const answer = game.commandParser.parse('talk to master merchant aldric')

    expect(answer).toContain('My premium selection includes')
    expectAldricSpeaks(answer)
  })

  it('attributes declining other items to Aldric', () => {
    const game = createGameAtMarket()
    game.state.addItemToInventory(new WalkingStick())

    const answer = game.commandParser.parse(
      'give walking stick to master merchant aldric',
    )

    expect(answer).toContain('I deal in adventure gear, not donations')
    expectAldricSpeaks(answer)
  })
})
