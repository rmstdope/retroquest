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
import { endingPlayed, farewell, justiceOpen, sacrificeOpen } from './endings'

function freshState(): Game['state'] {
  return new Game([new Act4()]).state
}

describe('endings', () => {
  it('opens Justice on two truths and Sacrifice on two unselfish moments', () => {
    const state = freshState()
    expect([justiceOpen(state), sacrificeOpen(state)]).toEqual([false, false])
    state.addVirtue(VIRTUE_TRUTH)
    state.addVirtue(VIRTUE_SELFLESS)
    state.addVirtue(VIRTUE_MERCY)
    state.addVirtue(VIRTUE_MERCY)
    expect([justiceOpen(state), sacrificeOpen(state)]).toEqual([false, false])
    state.addVirtue(VIRTUE_TRUTH)
    expect([justiceOpen(state), sacrificeOpen(state)]).toEqual([true, false])
    state.addVirtue(VIRTUE_SELFLESS)
    expect([justiceOpen(state), sacrificeOpen(state)]).toEqual([true, true])
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

  it('shares the farewell and varies one line by ending', () => {
    const lines = {
      redemption: 'You gave him back to us, our friend.',
      justice: 'You named what he did',
      sacrifice: 'You gave it all away, and kept the smallest thing.',
    } as const
    for (const [ending, line] of Object.entries(lines)) {
      const text = farewell(ending as keyof typeof lines)
      expect(text).toContain(line)
      expect(text).toContain('Go home, love. The field is waiting.')
      for (const other of Object.values(lines)) {
        if (other !== line) expect(text).not.toContain(other)
      }
    }
  })
})
