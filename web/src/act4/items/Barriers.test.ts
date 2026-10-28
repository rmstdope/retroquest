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

    expect(answer).toBe(
      'The violet wall is gone. The way on is only a way now.',
    )
    expectMarkupWellFormed(answer)
  })

  it('bars the ways on, north and east, not the gateway behind', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    const answer = new Barriers().examine(game.state)
    expect(answer).toBe(
      'A thin wall of violet light hangs across the ways on, north and east, humming in time with the ward stones. It is the only thing between you and the fortress.',
    )
    expect(answer).not.toContain('gateway')
  })
})
