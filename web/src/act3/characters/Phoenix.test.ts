import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Phoenix } from './Phoenix'
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
