import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { FLAG_JOURNEY_BLESS_COMPLETED } from '@/act1/Act1StoryFlags'
import { Act3 } from '../Act3'
import { BlessSpell } from './BlessSpell'

describe('BlessSpell in Act III', () => {
  it('settles its warmth without setting the Act I journey flag', () => {
    const game = new Game([new Act3()])

    const answer = new BlessSpell().castSpell(game.state)

    expect(answer).toContain('A quiet warmth settles on your shoulders')
    expect(game.state.getStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED)).toBe(false)
  })
})
