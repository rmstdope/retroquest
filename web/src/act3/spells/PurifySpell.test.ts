import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { PurifySpell } from './PurifySpell'
import { WardingPillars } from '../items/WardingPillars'

describe('Act 3 Purify spell', () => {
  it('returns brine-related text or a cast acknowledgement', () => {
    const spell = new PurifySpell()
    const game = new Game([new Act3()])

    const out = spell.castSpell(game.state).toLowerCase()

    expect(out.includes('brine') || out.includes('you cast')).toBe(true)
  })

  it('purifies the warding pillars', () => {
    const spell = new PurifySpell()
    const game = new Game([new Act3()])
    const pillars = new WardingPillars()

    const out = spell.castOnItem(game.state, pillars).toLowerCase()

    expect(out).toContain('[event]')
    expect(out.includes('glyph') || out.includes('tideward')).toBe(true)
  })
})
