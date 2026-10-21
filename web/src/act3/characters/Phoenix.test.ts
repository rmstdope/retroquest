import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Phoenix } from './Phoenix'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
} from '../Act3StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Phoenix dialogue markup', () => {
  it('attributes the riddle, wrong answer, right answer and repeat to the phoenix', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    const answers = [phoenix.talkTo(game.state)]
    answers.push(phoenix.sayTo(game.state, 'haste'))
    answers.push(phoenix.sayTo(game.state, 'patience'))
    answers.push(phoenix.sayTo(game.state, 'patience'))

    expect(game.state.hasItem('Phoenix Feather')).toBe(true)
    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, phoenix.name)
    }
  })
})

const HINT =
  'I asked this once of the Warden of Wisdom, when he came to me with his two friends. ' +
  'He knew the answer, and did not keep it.'
const LINK =
  'He gave your answer too. Then time grew short for his friends, and patience was the one thing ' +
  'he had none of. Do not become what he became.'
const FAREWELL = 'Remember him when time is short for you.'
const TERRACES =
  'You think of the third name burned deeper than the others on the terraces.'
const NOD = 'inclines its head.'

describe('Phoenix links patience to the Warden of Wisdom', () => {
  it('adds the hint to the riddle on every talk before the feather', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    const first = phoenix.talkTo(game.state)
    expect(first).toContain('What is wisdom when time is short?')
    expect(first).toContain(HINT)
    expect(phoenix.talkTo(game.state)).toBe(first)
    expect(first).not.toContain('Malakar')
  })

  it('leaves the wrong-answer reply unchanged', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    const reply = phoenix.sayTo(game.state, 'haste')
    expect(reply).toContain('Is that truly wisdom, when time is short?')
    expect(reply).not.toContain(LINK)
  })

  it('adds the link and the terraces line when the inscription was read', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    const reply = phoenix.sayTo(game.state, 'patience')
    expect(reply).toContain('Take this, and remember.')
    expect(reply).toContain(LINK)
    expect(reply.indexOf(LINK)).toBeGreaterThan(reply.indexOf('remember'))
    expect(reply).toContain(TERRACES)
    expect(reply.indexOf(TERRACES)).toBeGreaterThan(reply.indexOf(LINK))
    expectMarkupWellFormed(reply)
  })

  it('leaves out the terraces line when the inscription was not read', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    const reply = phoenix.sayTo(game.state, 'patience')
    expect(reply).toContain(LINK)
    expect(reply).not.toContain(TERRACES)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    expect(phoenix.talkTo(game.state)).not.toContain(TERRACES)
  })

  it('says a farewell instead of the riddle once the feather is earned', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    phoenix.sayTo(game.state, 'patience')
    const farewell = phoenix.talkTo(game.state)
    expect(farewell).toContain(NOD)
    expect(farewell).toContain(FAREWELL)
    expect(farewell).not.toContain('What is wisdom')
    expectMarkupWellFormed(farewell)
    expectDialogueSpeaker(farewell, phoenix.name)
    expect(phoenix.sayTo(game.state, 'anything')).toContain(
      'You already hold what you have earned.',
    )
  })

  it('gives the farewell to a phoenix that never posed the riddle this session', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    const reply = new Phoenix().talkTo(game.state)
    expect(reply).toContain(FAREWELL)
    expect(reply).not.toContain('What is wisdom')
  })
})
