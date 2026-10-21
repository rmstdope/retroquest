import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
} from '../Act4StoryFlags'
import { TrappedServants } from './TrappedServants'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const SPEAKER = 'Trapped Servants'

/** Create an Act IV game with the player in the Outer Courtyard. */
function createGameInCourtyard(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = game.state.allRooms.OuterCourtyard
  return game
}

describe('TrappedServants', () => {
  it('answers to servants, trapped servants and freed servants', () => {
    const servants = new TrappedServants()
    expect(servants.answersTo('servants')).toBe(true)
    expect(servants.answersTo('Trapped Servants')).toBe(true)
    expect(servants.answersTo('freed servants')).toBe(true)
    expect(servants.answersTo('captain')).toBe(false)
  })

  it('asks for proof of courage before trust is earned', () => {
    const game = createGameInCourtyard()

    const answer = game.commandParser.parse('talk to trapped servants')

    expect(answer).toContain('you would carry something of theirs')
    expect(answer).not.toContain('Prove your courage')
    expectDialogueSpeaker(answer, SPEAKER)
    expectMarkupWellFormed(answer)
  })

  it('asks for compassion once trust is earned', () => {
    const game = createGameInCourtyard()
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED, true)

    const answer = game.commandParser.parse('talk to trapped servants')

    expect(answer).toContain('do it gently')
    expectDialogueSpeaker(answer, SPEAKER)
    expectMarkupWellFormed(answer)
  })

  it('thanks the player once freed', () => {
    const game = createGameInCourtyard()
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED, true)
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    const servants = new TrappedServants()
    servants.free()

    const answer = servants.talkTo(game.state)

    expect(answer).toContain('listen for the ones who have nothing left')
    expectDialogueSpeaker(answer, 'Freed Servants')
    expectMarkupWellFormed(answer)
  })
})
