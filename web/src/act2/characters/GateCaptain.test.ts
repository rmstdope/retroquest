import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { GateCaptain } from './GateCaptain'
import type { GreendaleGates } from '../rooms/GreendaleGates'
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

  it('leaves the room in the same turn as he accepts the pass', () => {
    const game = createGameAtGates()
    game.state.addItemToInventory(new EntryPass())

    const answer = game.commandParser.parse('give entry pass to gate captain')

    expect(answer).toContain("You'll need a map to navigate the city")
    expect(answer).toContain('information post')
    expect(answer).toContain('salutes smartly')
    expect(answer).not.toContain('He steps aside')
    expect(game.state.currentRoom.characters).toHaveLength(0)
    expectCaptainSpeaks(answer)
  })

  it('is not there to talk to after he accepted the pass', () => {
    const game = createGameAtGates()
    game.state.addItemToInventory(new EntryPass())
    game.commandParser.parse('give entry pass to gate captain')

    game.state.addItemToInventory(new EntryPass())

    const talk = game.commandParser.parse('talk to gate captain')
    const give = game.commandParser.parse('give entry pass to gate captain')

    expect(talk).toContain(
      "There is no character named '[character_name]gate captain",
    )
    expect(give).toContain("There is no character named 'Gate captain' here.")
  })

  it('still sends off a captain left in the room by an older save', () => {
    const game = createGameAtGates()
    const gates = game.state.allRooms.GreendaleGates as GreendaleGates
    gates.gateCaptain.entryPassGiven = true

    const answer = game.commandParser.parse('talk to gate captain')

    expect(answer).toContain('Welcome to Greendale, honored visitor')
    expect(answer).toContain('salutes smartly')
    expect(gates.characters).toHaveLength(0)
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

describe('Gate Captain welcome', () => {
  it('points the player to the information post before leaving', () => {
    const game = createGameAtGates()
    const captain = new GateCaptain()
    game.state.currentRoom.characters.push(captain)
    captain.giveItem(game.state, new EntryPass())

    const answer = captain.talkTo(game.state)

    expect(answer).toContain(
      'Travelers leave all sorts at the information post by the arch; have a ' +
        'look there before you go in.',
    )
    expect(answer).not.toContain('Feel free to look around')
    expectCaptainSpeaks(answer)
  })
})
