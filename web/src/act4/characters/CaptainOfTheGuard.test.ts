import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_SERVANTS_FREED } from '../Act4StoryFlags'
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
})
