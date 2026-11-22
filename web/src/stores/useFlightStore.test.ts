import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  FLIGHT_FLY_MS,
  FLIGHT_HOLD_MS,
  FLIGHT_LAND_MS,
  FLIGHT_SHOW_MS,
  LEAVE_DIP_MS,
  LEAVE_REST_MS,
  LEAVE_RISE_MS,
  LEAVE_SINK_MS,
  useFlightStore,
} from './useFlightStore'

describe('useFlightStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  const lantern = { kind: 'item' as const, name: 'lantern', count: 1 }
  const revive = { kind: 'spell' as const, name: 'revive', count: 1 }

  it('owes a kind from the turn it is gained until its flight lands, is forgiven or is cleared', () => {
    const flights = useFlightStore()
    flights.owe([lantern, revive])
    expect(flights.owes('item')).toBe(true)
    expect(flights.owes('spell')).toBe(true)
    flights.forgive([lantern])
    expect(flights.owes('item')).toBe(false)
    expect(flights.owes('spell')).toBe(true)
    flights.clear()
    expect(flights.owes('spell')).toBe(false)
  })

  it('shows a gained thing, rests, flies to its button and lands there', () => {
    const flights = useFlightStore()
    flights.launch([lantern])
    expect(flights.current?.name).toBe('lantern')
    expect(flights.phase).toBe('show')
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS - 1)
    expect(flights.phase).toBe('show')
    vi.advanceTimersByTime(1)
    expect(flights.phase).toBe('fly')
    expect(flights.landed).toBeNull()
    vi.advanceTimersByTime(FLIGHT_FLY_MS)
    expect(flights.current).toBeNull()
    expect(flights.landed).toBe('item')
    expect(flights.landedName).toBe('lantern')
    vi.advanceTimersByTime(FLIGHT_LAND_MS)
    expect(flights.landed).toBeNull()
    expect(flights.landedName).toBeNull()
  })

  it('flies several things one after another', () => {
    const flights = useFlightStore()
    flights.launch([lantern, revive])
    expect(flights.current?.name).toBe('lantern')
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
    expect(flights.landed).toBe('item')
    expect(flights.current?.name).toBe('revive')
    expect(flights.phase).toBe('show')
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
    expect(flights.landed).toBe('spell')
    expect(flights.current).toBeNull()
  })

  it('stops at once, with nothing left to fly, when cleared', () => {
    const flights = useFlightStore()
    flights.launch([lantern, revive])
    flights.clear()
    expect(flights.current).toBeNull()
    expect(flights.landed).toBeNull()
    vi.runAllTimers()
    expect(flights.current).toBeNull()
    expect(flights.landed).toBeNull()
  })

  it('gives each flight its own key, so the view starts it afresh', () => {
    const flights = useFlightStore()
    flights.launch([lantern])
    const first = flights.current?.key
    flights.clear()
    flights.launch([lantern])
    expect(flights.current?.key).not.toBe(first)
  })

  it('tells every gain as it is queued, the ones still to fly too', () => {
    const flights = useFlightStore()
    flights.launch([lantern, revive])
    expect(flights.told).toEqual(['Gained Lantern', 'Learned Revive'])
  })

  it('forgets what it told when cleared', () => {
    const flights = useFlightStore()
    flights.launch([lantern])
    flights.clear()
    expect(flights.told).toEqual([])
  })

  describe('an item leaving the bag', () => {
    const bread = { kind: 'item' as const, name: 'bread', count: 1 }
    const coins = { kind: 'item' as const, name: 'coin', count: 3 }

    it('rises, rests and sinks, dipping the Bag button as it rises', () => {
      const flights = useFlightStore()
      flights.launch([], [bread])
      expect(flights.current?.leaving).toBe(true)
      expect(flights.phase).toBe('rise')
      expect(flights.dipped).toBe('item')
      vi.advanceTimersByTime(LEAVE_DIP_MS)
      expect(flights.dipped).toBeNull()
      vi.advanceTimersByTime(LEAVE_RISE_MS - LEAVE_DIP_MS)
      expect(flights.phase).toBe('rest')
      vi.advanceTimersByTime(LEAVE_REST_MS)
      expect(flights.phase).toBe('sink')
      vi.advanceTimersByTime(LEAVE_SINK_MS)
      expect(flights.current).toBeNull()
      expect(flights.landed).toBeNull()
    })

    it('goes before the gains, one flight after another', () => {
      const flights = useFlightStore()
      const hook = { kind: 'item' as const, name: 'hook', count: 1 }
      const rope = { kind: 'item' as const, name: 'rope', count: 1 }
      flights.launch([hook], [bread, rope])
      expect(flights.current?.name).toBe('bread')
      vi.advanceTimersByTime(LEAVE_RISE_MS + LEAVE_REST_MS + LEAVE_SINK_MS)
      expect(flights.current?.name).toBe('rope')
      vi.advanceTimersByTime(LEAVE_RISE_MS + LEAVE_REST_MS + LEAVE_SINK_MS)
      expect(flights.current?.name).toBe('hook')
      expect(flights.current?.leaving).toBe(false)
      expect(flights.phase).toBe('show')
    })

    it('tells losses before gains', () => {
      const flights = useFlightStore()
      flights.launch([lantern], [bread, coins])
      expect(flights.told).toEqual([
        'Lost Bread',
        'Lost Coin ×3',
        'Gained Lantern',
      ])
    })

    it('does not dip, and does not rise, when motion is reduced', () => {
      const flights = useFlightStore()
      flights.launch([], [bread], true)
      expect(flights.phase).toBe('rest')
      expect(flights.dipped).toBeNull()
    })

    it('leaves no dip and no flight when cleared', () => {
      const flights = useFlightStore()
      flights.launch([], [bread])
      flights.clear()
      expect(flights.current).toBeNull()
      expect(flights.dipped).toBeNull()
      vi.runAllTimers()
      expect(flights.current).toBeNull()
    })
  })

  it('keeps the bump of a later landing of the same kind when an earlier one times out', () => {
    const flights = useFlightStore()
    flights.launch([lantern, { kind: 'item', name: 'rope', count: 1 }])
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
    expect(flights.landedName).toBe('lantern')
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
    expect(flights.landedName).toBe('rope')
    vi.advanceTimersByTime(FLIGHT_LAND_MS - 1)
    expect(flights.landedName).toBe('rope')
  })

  it('ends its timers when its scope is disposed', () => {
    const flights = useFlightStore()
    flights.launch([lantern])
    flights.$dispose()
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
    expect(flights.phase).toBe('show')
    expect(flights.landed).toBeNull()
  })

  it('tells each gain when its name comes up, one after another (rq-sm83)', () => {
    const flights = useFlightStore()
    const shown: string[] = []
    const first = { ...lantern, areaId: 'lantern' }
    flights.launch([first, revive], [], false, (flight) =>
      shown.push(flight.name),
    )
    expect(shown).toEqual(['lantern'])
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
    expect(shown).toEqual(['lantern', 'revive'])
  })

  it('tells a gain when it comes up under Reduce motion too (rq-sm83)', () => {
    const flights = useFlightStore()
    const shown: string[] = []
    flights.launch([lantern], [], true, (flight) => shown.push(flight.name))
    expect(shown).toEqual(['lantern'])
  })

  it('runs what waits for the flights once the last has landed, at once when idle (rq-sm83)', () => {
    const flights = useFlightStore()
    const ran: number[] = []
    flights.whenIdle(() => ran.push(1))
    expect(ran).toEqual([1])
    flights.launch([lantern, revive])
    flights.whenIdle(() => ran.push(2))
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
    expect(ran).toEqual([1])
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
    expect(ran).toEqual([1, 2])
  })

  it('does not run what waits when cleared (rq-sm83)', () => {
    const flights = useFlightStore()
    const ran: number[] = []
    flights.launch([lantern])
    flights.whenIdle(() => ran.push(1))
    flights.clear()
    vi.advanceTimersByTime(10000)
    expect(ran).toEqual([])
  })

  describe('what is owed', () => {
    it('owes a gained thing from the moment it is owed until it lands', () => {
      const flights = useFlightStore()
      flights.owe([lantern, revive])
      expect(flights.owing('item', 'lantern')).toBe(1)
      flights.launch([lantern, revive])
      vi.advanceTimersByTime(
        FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS - 1,
      )
      expect(flights.owing('item', 'lantern')).toBe(1)
      vi.advanceTimersByTime(1)
      expect(flights.owing('item', 'lantern')).toBe(0)
      expect(flights.owing('spell', 'revive')).toBe(1)
      vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
      expect(flights.owing('spell', 'revive')).toBe(0)
    })

    it('owes as many as were gained, and the same name of another kind separately', () => {
      const flights = useFlightStore()
      flights.owe([{ kind: 'item', name: 'apple', count: 3 }])
      expect(flights.owing('item', 'apple')).toBe(3)
      expect(flights.owing('spell', 'apple')).toBe(0)
    })

    it('pays back only the landed thing, leaving another of the same kind owed', () => {
      const flights = useFlightStore()
      const key = { kind: 'item' as const, name: 'key', count: 1 }
      flights.owe([lantern, key])
      flights.launch([lantern, key])
      vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
      expect(flights.owing('item', 'lantern')).toBe(0)
      expect(flights.owing('item', 'key')).toBe(1)
    })

    it('shows a thing that will not fly at once, once forgiven', () => {
      const flights = useFlightStore()
      flights.owe([lantern, revive])
      flights.forgive([lantern])
      expect(flights.owing('item', 'lantern')).toBe(0)
      expect(flights.owing('spell', 'revive')).toBe(1)
    })

    it('forgets what is owed when cleared', () => {
      const flights = useFlightStore()
      flights.owe([lantern])
      flights.clear()
      expect(flights.owing('item', 'lantern')).toBe(0)
    })
  })

  describe('a change', () => {
    const filling = { from: 'bucket', to: 'bucket (full)' }

    it('shows one change, then flies it like a gain; the list waits for the new name', () => {
      const flights = useFlightStore()
      flights.owe([], [filling])
      expect(flights.owing('item', 'bucket (full)')).toBe(1)
      flights.launch([], [], false, undefined, [filling])
      expect(flights.current).toMatchObject({
        kind: 'item',
        name: 'bucket (full)',
        from: 'bucket',
        leaving: false,
      })
      expect(flights.told).toEqual(['Changed Bucket to Bucket (full)'])
      vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS)
      expect(flights.phase).toBe('fly')
      vi.advanceTimersByTime(FLIGHT_FLY_MS)
      expect(flights.current).toBeNull()
      expect(flights.landedName).toBe('bucket (full)')
      expect(flights.owing('item', 'bucket (full)')).toBe(0)
    })

    it('comes after what was lost and before what was gained, each told', () => {
      const flights = useFlightStore()
      const lost = { kind: 'item' as const, name: 'map', count: 1 }
      flights.launch([lantern], [lost], false, undefined, [filling])
      expect(flights.told).toEqual([
        'Lost Map',
        'Changed Bucket to Bucket (full)',
        'Gained Lantern',
      ])
      expect(flights.current?.name).toBe('map')
      vi.advanceTimersByTime(LEAVE_RISE_MS + LEAVE_REST_MS + LEAVE_SINK_MS)
      expect(flights.current?.from).toBe('bucket')
      vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
      expect(flights.current?.name).toBe('lantern')
    })

    it('flies the same under reduced motion (the card is told not to move by its styles)', () => {
      const flights = useFlightStore()
      flights.launch([], [], true, undefined, [filling])
      expect(flights.current?.from).toBe('bucket')
      vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS)
      expect(flights.current).toBeNull()
      expect(flights.owing('item', 'bucket (full)')).toBe(0)
    })

    it('is forgiven like a gain when it will not fly', () => {
      const flights = useFlightStore()
      flights.owe([], [filling])
      flights.forgive([], [filling])
      expect(flights.owes('item')).toBe(false)
    })

    it('names the old state a changed thing stands in as while it is owed', () => {
      const flights = useFlightStore()
      expect(flights.standIn('item', filling.to)).toBeNull()
      flights.owe([], [filling])
      expect(flights.standIn('item', filling.to)).toBe(filling.from)
      flights.forgive([], [filling])
      expect(flights.standIn('item', filling.to)).toBeNull()
    })

    it('does not stand in for the same name gained as a plain thing later', () => {
      const flights = useFlightStore()
      flights.owe([], [filling])
      flights.forgive([], [filling])
      flights.owe([{ kind: 'item', name: filling.to, count: 1 }])
      expect(flights.standIn('item', filling.to)).toBeNull()
    })
  })
})
