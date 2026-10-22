import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { PurifySpell } from './PurifySpell'
import { WardingPillars } from '../items/WardingPillars'
import { Steles } from '../items/Steles'

describe('Act 3 Purify spell', () => {
  it('returns brine-related text or a cast acknowledgement', () => {
    const spell = new PurifySpell()
    const game = new Game([new Act3()])

    const out = spell.castSpell(game.state).toLowerCase()

    expect(out.includes('brine') || out.includes('you cast')).toBe(true)
  })

  it('scours the steles for the sight of it, gaining nothing', () => {
    const game = new Game([new Act3()])

    const out = new PurifySpell().castOnItem(game.state, new Steles())

    expect(out).toContain(
      'the moon-marks stand clearer than they have in years',
    )
    expect(out).toContain('then the grey comes back')
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
