import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { PurifySpell } from './PurifySpell'
import { WardingPillars } from '../items/WardingPillars'
import { Steles } from '../items/Steles'
import { PrismLantern } from '../items/PrismLantern'
import { Mira } from '../characters/Mira'

describe('Act 3 Purify spell', () => {
  it('returns brine-related text or a cast acknowledgement', () => {
    const spell = new PurifySpell()
    const game = new Game([new Act3()])

    const out = spell.castSpell(game.state).toLowerCase()

    expect(out.includes('brine') || out.includes('you cast')).toBe(true)
  })

  it('casts without repeating the command', () => {
    const game = new Game([new Act3()])

    const out = new PurifySpell().castSpell(game.state)

    expect(out).not.toContain('You cast')
    expect(out).not.toContain('[event]')
    expect(out).toContain('brine-bright clarity')
  })

  it('says one sentence for every thing it cannot change', () => {
    const game = new Game([new Act3()])

    const out = new PurifySpell().castOnItem(game.state, new PrismLantern())

    expect(out).toBe(
      'Saltlight skims the surface, though nothing more changes.',
    )
  })

  it('casts on a character without repeating the command', () => {
    const game = new Game([new Act3()])

    const out = new PurifySpell().castOnCharacter(game.state, new Mira())

    expect(out).not.toContain('You cast')
    expect(out).toContain('A cleansing calm settles')
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

    expect(out).not.toContain('[event]')
    expect(out.includes('glyph') || out.includes('tideward')).toBe(true)
  })
})
