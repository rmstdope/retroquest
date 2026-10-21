import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_BARRIERS_DISABLED } from '../Act4StoryFlags'
import { Barriers } from './Barriers'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('Barriers', () => {
  it('uses known tags when examined after being disabled', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    game.state.setStoryFlag(FLAG_ACT4_BARRIERS_DISABLED, true)

    const answer = new Barriers().examine(game.state)

    expect(answer).toContain('The violet wall is gone')
    expectMarkupWellFormed(answer)
  })
})
