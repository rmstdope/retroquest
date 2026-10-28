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

    expect(answer).toContain(
      '[dialogue]Others came through that gate. They were all brave, until the guardians. If you were braver than the guardians, you would carry something of theirs.[/dialogue]',
    )
    expect(answer).not.toContain('Prove your courage')
    expectDialogueSpeaker(answer, SPEAKER)
    expectMarkupWellFormed(answer)
  })

  it('asks for compassion once trust is earned', () => {
    const game = createGameInCourtyard()
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED, true)

    const answer = game.commandParser.parse('talk to trapped servants')

    expect(answer).toContain(
      '[dialogue]We are so tired. No one has said a kind word over us in years. Whatever you can do for us, do it gently.[/dialogue]',
    )
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

    expect(answer).toContain(
      'One of them, an old woman with flour still in the creases of her hands, looks up.',
    )
    expect(answer).toContain(
      "[dialogue]I was the king's cook. I do not know how long ago.[/dialogue]",
    )
    expect(answer).not.toContain('mirrors')
    expect(servants.talkTo(game.state)).toBe(answer)
    expectDialogueSpeaker(answer, 'Freed Servants')
    expectMarkupWellFormed(answer)
  })

  it('are described in chains while trapped and at rest once freed', () => {
    const game = createGameInCourtyard()
    const servants = new TrappedServants()
    expect(servants.examine(game.state)).toContain('chains of shadow')
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    servants.free()
    const freed = servants.examine(game.state)
    expect(freed).toBe(
      'The freed servants sit by the fountains in their kitchen aprons and stable coats, rubbing their ankles where the chains were.',
    )
    expect(freed).not.toContain('None of them looks up')
  })
})
