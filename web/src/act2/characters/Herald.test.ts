import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { EntryPass } from '../items/EntryPass'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'herald'

/** An Act II game with the player at the Castle Approach. */
function createGameAtCastleApproach(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.CastleApproach
  return game
}

/** The answer is well formed and the herald speaks every dialogue. */
function expectHeraldSpeaks(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

describe('Herald dialogue markup', () => {
  it('attributes the talk before the pass to the herald', () => {
    const game = createGameAtCastleApproach()

    const answer = game.commandParser.parse('talk to herald')

    expect(answer).toContain('I must examine your credentials')
    expectHeraldSpeaks(answer)
  })

  it('attributes giving the entry pass to the herald', () => {
    const game = createGameAtCastleApproach()
    game.state.addItemToInventory(new EntryPass())

    const answer = game.commandParser.parse('give entry pass to herald')

    expect(answer).toContain(
      'This is a formal recommendation of excellent standing',
    )
    expect(answer).toContain('The pass has been officially registered')
    expectHeraldSpeaks(answer)
  })

  it('attributes the talk after the pass to the herald', () => {
    const game = createGameAtCastleApproach()
    game.state.addItemToInventory(new EntryPass())
    game.commandParser.parse('give entry pass to herald')

    const answer = game.commandParser.parse('talk to herald')

    expect(answer).toContain('Your credentials have been verified')
    expectHeraldSpeaks(answer)
  })
})
