import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { QualityRope } from './QualityRope'

describe('the quality rope used alone', () => {
  it('says what it is and what it wants, not what the player must do', () => {
    const game = new Game([new Act2()])

    const out = new QualityRope().use(game.state)

    expect(out).toContain(
      'You coil the quality rope over your arm: fifty feet of it, tight-laid, ' +
        'without a frayed strand. It wants an edge to be dropped over.',
    )
    expect(out).not.toContain('You need to')
  })
})
