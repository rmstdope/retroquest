import { describe, it, expect } from 'vitest'
import { actLabel, savedWhen } from './saveCard'

describe('actLabel', () => {
  it('writes the act number as a Roman numeral', () => {
    expect(actLabel('Act 1')).toBe('Act I')
    expect(actLabel('Act 4')).toBe('Act IV')
  })

  it('leaves other names as they are', () => {
    expect(actLabel('Act III')).toBe('Act III')
    expect(actLabel(null)).toBe('')
  })
})

describe('savedWhen', () => {
  // Monday 19 October 2026, 15:00 local time.
  const NOW = new Date(2026, 9, 19, 15, 0)

  it('says Today for a save made today', () => {
    expect(savedWhen(new Date(2026, 9, 19, 14, 51).toISOString(), NOW)).toBe(
      'Today · 14:51',
    )
  })

  it('says Yesterday for a save made the day before', () => {
    expect(savedWhen(new Date(2026, 9, 18, 9, 5).toISOString(), NOW)).toBe(
      'Yesterday · 09:05',
    )
  })

  it('gives the day and month for older saves', () => {
    expect(savedWhen(new Date(2026, 9, 14, 21, 14).toISOString(), NOW)).toBe(
      '14 Oct · 21:14',
    )
  })

  it('says nothing when the time is unknown', () => {
    expect(savedWhen(null, NOW)).toBe('')
    expect(savedWhen('not a date', NOW)).toBe('')
  })
})
