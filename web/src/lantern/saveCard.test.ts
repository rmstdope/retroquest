import { describe, it, expect } from 'vitest'
import type { SaveSlot } from '@/types/bridge'
import {
  actLabel,
  cardKey,
  continueCard,
  filled,
  newestLoadable,
  oldestFilled,
  savedWhen,
} from './saveCard'

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

describe('continueCard', () => {
  it('names the place, with the act and when under it', () => {
    const now = new Date(2026, 10, 4, 12, 0)
    expect(continueCard(card(1), now)).toEqual({
      title: 'The Old Mill',
      line: 'Act II · Yesterday · 21:14',
    })
  })

  it('calls a quick save with no place Quick save', () => {
    const now = new Date(2026, 10, 4, 12, 0)
    expect(continueCard(card(0, { room: null }), now)).toEqual({
      title: 'Quick save',
      line: 'Act II · Yesterday · 21:14',
    })
  })
})

describe('named saves', () => {
  const NOW = new Date(2026, 9, 19, 15, 0)
  const at = new Date(2026, 9, 19, 14, 51).toISOString()
  const named = (over: Partial<SaveSlot> = {}): SaveSlot => ({
    slot: -1,
    name: 'before-the-mirrors',
    act: 'Act 3',
    room: 'Mount Ember',
    timestamp: at,
    quests: { completed: 5, total: 7 },
    ...over,
  })

  it('counts a named card as filled', () => {
    expect(filled(named({ act: null, room: null }))).toBe(true)
  })

  it('names the place on the Continue card and starts the line under it with the name', () => {
    expect(continueCard(named(), NOW)).toEqual({
      title: 'Mount Ember',
      line: 'before-the-mirrors · Act III · Today · 14:51',
    })
  })

  it('names the save on the Continue card when it has no act or room', () => {
    expect(continueCard(named({ act: null, room: null }), NOW)).toEqual({
      title: 'before-the-mirrors',
      line: 'Today · 14:51',
    })
  })

  it('lets the newest named save win over older slots', () => {
    const slot: SaveSlot = {
      slot: 1,
      act: 'Act 1',
      room: 'The Dream',
      timestamp: new Date(2026, 9, 1).toISOString(),
      quests: null,
    }
    expect(newestLoadable([slot, named()])?.name).toBe('before-the-mirrors')
  })

  it('never picks an outdated named save', () => {
    expect(newestLoadable([named({ outdated: true })])).toBeNull()
  })

  it('keys a named card by its name and others by slot', () => {
    expect(cardKey(named())).toBe('name:before-the-mirrors')
    expect(cardKey({ ...named(), slot: 3, name: undefined })).toBe(3)
  })
})

describe('oldestFilled', () => {
  const at = (n: number, timestamp: string | null): SaveSlot => ({
    ...card(n),
    timestamp,
  })
  it('picks the save made longest ago', () => {
    const a = at(1, '2026-01-02T10:00:00Z')
    const b = at(2, '2026-01-01T10:00:00Z')
    expect(oldestFilled([a, b])).toBe(b)
  })
  it('counts a save with no time as the oldest, and skips empty slots', () => {
    const none = at(3, null)
    const dated = at(1, '2026-01-01T10:00:00Z')
    expect(oldestFilled([dated, none])).toBe(none)
    expect(oldestFilled([card(5, { room: null }), dated])).toBe(dated)
    expect(oldestFilled([])).toBeNull()
  })
})
