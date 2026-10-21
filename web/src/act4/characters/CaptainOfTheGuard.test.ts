import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_SERVANTS_FREED,
} from '../Act4StoryFlags'
import { CaptainOfTheGuard } from './CaptainOfTheGuard'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const SPEAKER = 'Captain of the Guard'

/** Create an Act IV game for the captain's lines. */
function createGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  return new Game([act])
}

describe('CaptainOfTheGuard', () => {
  it('answers to captain and his full name', () => {
    const captain = new CaptainOfTheGuard()
    expect(captain.answersTo('captain')).toBe(true)
    expect(captain.answersTo('Captain of the Guard')).toBe(true)
    expect(captain.answersTo('servants')).toBe(false)
  })

  it('is muddled while the servants are chained', () => {
    const answer = new CaptainOfTheGuard().talkTo(createGame().state)
    expect(answer).toContain('I held the gate for King Alden once.')
    expectDialogueSpeaker(answer, SPEAKER)
    expectMarkupWellFormed(answer)
  })

  it('remembers Cedric once the servants are freed', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    const answer = new CaptainOfTheGuard().talkTo(game.state)
    expect(answer).toContain('Cedric stood his post')
    expectDialogueSpeaker(answer, SPEAKER)
    expectMarkupWellFormed(answer)
  })

  it('remembers King Alden on the walls before the knight is redeemed', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
    const answer = new CaptainOfTheGuard().talkTo(game.state)
    expect(answer).toContain(
      'King Alden used to walk the walls at night and talk to whoever was on them. That is how they got him.',
    )
    expect(answer).not.toContain('man in grey')
    expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)).toBe(
      false,
    )
  })

  describe('after the knight is redeemed', () => {
    const MAN_IN_GREY =
      'A man in grey came through here while you were gone, on his knees. He asked my name. I told him.'

    function createRedeemedGame(): Game {
      const game = createGame()
      game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
      return game
    }

    it('tells of the man in grey once, at the end of the same line', () => {
      const game = createRedeemedGame()
      const first = new CaptainOfTheGuard().talkTo(game.state)
      expect(first).toContain(
        'tell him I am sorry I ever doubted him. ' + MAN_IN_GREY,
      )
      expect(first).toContain("'I remember now.")
      expectDialogueSpeaker(first, SPEAKER)
      expectMarkupWellFormed(first)
      expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)).toBe(
        true,
      )
    })

    it('gives the usual awake line on every later talk', () => {
      const game = createRedeemedGame()
      const captain = new CaptainOfTheGuard()
      captain.talkTo(game.state)
      const second = captain.talkTo(game.state)
      expect(second).not.toContain('man in grey')
      expect(second).toContain('Cedric stood his post')
    })

    it('keeps whether it was told through save and load', () => {
      const game = createRedeemedGame()
      const before = game.toSaveData()
      new CaptainOfTheGuard().talkTo(game.state)
      const after = game.toSaveData()
      game.loadSaveData(before)
      expect(new CaptainOfTheGuard().talkTo(game.state)).toContain(MAN_IN_GREY)
      game.loadSaveData(after)
      expect(new CaptainOfTheGuard().talkTo(game.state)).not.toContain(
        'man in grey',
      )
    })

    it('does not tell it while still enthralled', () => {
      const game = createGame()
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
      const answer = new CaptainOfTheGuard().talkTo(game.state)
      expect(answer).not.toContain('man in grey')
      expect(game.state.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)).toBe(
        false,
      )
    })
  })
})
