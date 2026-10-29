import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from './Act4'
import {
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
  VIRTUE_MERCY,
  VIRTUE_SELFLESS,
  VIRTUE_TRUTH,
} from './Act4StoryFlags'
import { endingPlayed, farewell, selflessLine, truthLine } from './endings'

function freshState(): Game['state'] {
  return new Game([new Act4()]).state
}

describe('endings', () => {
  it('adds the truth and selfless lines from two moments each', () => {
    const state = freshState()
    expect([truthLine(state), selflessLine(state)]).toEqual([null, null])
    state.addVirtue(VIRTUE_TRUTH)
    state.addVirtue(VIRTUE_SELFLESS)
    state.addVirtue(VIRTUE_MERCY)
    state.addVirtue(VIRTUE_MERCY)
    expect([truthLine(state), selflessLine(state)]).toEqual([null, null])
    state.addVirtue(VIRTUE_TRUTH)
    expect(truthLine(state)).toContain('You named every crime')
    expect(selflessLine(state)).toBeNull()
    state.addVirtue(VIRTUE_SELFLESS)
    expect(selflessLine(state)).toContain('We watched you give')
  })

  it('reports the ending that was played', () => {
    const state = freshState()
    expect(endingPlayed(state)).toBeNull()
    state.setStoryFlag(FLAG_ACT4_SACRIFICE_ENDING, true)
    expect(endingPlayed(state)).toBe('sacrifice')
    state.setStoryFlag(FLAG_ACT4_JUSTICE_ENDING, true)
    expect(endingPlayed(state)).toBe('justice')
    state.setStoryFlag(FLAG_ACT4_REDEMPTION_ENDING, true)
    expect(endingPlayed(state)).toBe('redemption')
  })

  it('describes the parents the way Act III pictured them', () => {
    const text = farewell('justice', freshState())
    expect(text).toContain('a man with your face, and a woman with Grandmother')
    expect(text).toContain("Grandmother's eyes. Your parents.")
    expect(text).not.toContain("Grandmother's smile")
  })

  it('shares the farewell and varies one line by ending', () => {
    const lines = {
      redemption: 'You gave him back to us, our friend.',
      justice: 'You named what he did',
      sacrifice: 'You gave our gift back to close what he opened',
    } as const
    for (const [ending, line] of Object.entries(lines)) {
      const text = farewell(ending as keyof typeof lines, freshState())
      expect(text).toContain(line)
      expect(text).toContain('Go home, love. The field is waiting.')
      for (const other of Object.values(lines)) {
        if (other !== line) expect(text).not.toContain(other)
      }
    }
  })
})
