import { describe, it, expect } from 'vitest'
import type { SaveSlot } from '@/types/bridge'
import { actLabel, continueLine, newestLoadable, savedWhen } from './saveCard'

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

function card(slot: number, over: Partial<SaveSlot> = {}): SaveSlot {
  return {
    slot,
    act: 'Act 2',
    room: 'The Old Mill',
    timestamp: '2026-11-03T21:14:00',
    quests: null,
    ...over,
  }
}

describe('newestLoadable', () => {
  it('picks the newest save, the quick save included', () => {
    const quick = card(0, { room: null, timestamp: '2026-11-04T09:00:00' })
    const older = card(2, { timestamp: '2026-11-01T09:00:00' })
    expect(newestLoadable([quick, older, card(1)])).toBe(quick)
  })

  it('skips old-version and empty slots', () => {
    const old = card(1, { outdated: true, timestamp: '2026-11-04T09:00:00' })
    const empty = card(2, { room: null, timestamp: null })
    const ok = card(3)
    expect(newestLoadable([old, empty, ok])).toBe(ok)
  })

  it('is null when nothing can be loaded', () => {
    expect(newestLoadable([card(1, { outdated: true })])).toBeNull()
    expect(newestLoadable([card(1, { room: null })])).toBeNull()
  })

  it('lets the first listed win a tie', () => {
    const quick = card(0, { room: null })
    expect(newestLoadable([quick, card(1)])).toBe(quick)
  })
})

describe('continueLine', () => {
  it('reads act · place · when like the save card', () => {
    const now = new Date(2026, 10, 4, 12, 0)
    expect(continueLine(card(1), now)).toBe(
      'Act II · The Old Mill · Yesterday · 21:14',
    )
  })

  it('calls the quick save Quick save', () => {
    const now = new Date(2026, 10, 4, 12, 0)
    expect(continueLine(card(0, { room: null }), now)).toBe(
      'Act II · Quick save · Yesterday · 21:14',
    )
  })
})
