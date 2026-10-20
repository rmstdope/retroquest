import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { GateCaptain } from './GateCaptain'
import { EntryPass } from '../items/EntryPass'
import { WalkingStick } from '../items/WalkingStick'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'Gate Captain'

/** An Act II game with the player at the Greendale Gates. */
function createGameAtGates(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.GreendaleGates
  return game
}

/** The answer is well formed and the captain speaks every dialogue. */
function expectCaptainSpeaks(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

describe('Gate Captain dialogue markup', () => {
  it('uses known tags when showing the entry pass again', () => {
    const game = new Game([new Act2()])
    const captain = new GateCaptain()
    captain.giveItem(game.state, new EntryPass())

    const answer = captain.giveItem(game.state, new EntryPass())

    expect(answer).toContain('already shown the entry pass')
    expectMarkupWellFormed(answer)
  })

  it('attributes the talk before the entry pass to the captain', () => {
    const game = createGameAtGates()

    const answer = game.commandParser.parse('talk to gate captain')

    expect(answer).toContain('State your business in Greendale')
    expectCaptainSpeaks(answer)
  })

  it('attributes showing the entry pass to the captain', () => {
    const game = createGameAtGates()
    game.state.addItemToInventory(new EntryPass())

    const answer = game.commandParser.parse('give entry pass to gate captain')

    expect(answer).toContain('This is legitimate documentation indeed')
    expectCaptainSpeaks(answer)
  })

  it('attributes the talk after the entry pass to the captain', () => {
    const game = createGameAtGates()
    game.state.addItemToInventory(new EntryPass())
    game.commandParser.parse('give entry pass to gate captain')

    const answer = game.commandParser.parse('talk to gate captain')

    expect(answer).toContain('Welcome to Greendale, honored visitor')
    expect(answer).toContain('salutes smartly')
    expectCaptainSpeaks(answer)
  })

  it('attributes declining other items to the captain', () => {
    const game = createGameAtGates()
    game.state.addItemToInventory(new WalkingStick())

    const answer = game.commandParser.parse(
      'give walking stick to gate captain',
    )

    expect(answer).toContain('I only need to see proper entry documentation')
    expectCaptainSpeaks(answer)
  })
})
