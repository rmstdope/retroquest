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
    vi.advanceTimersByTime(FLIGHT_LAND_MS)
    expect(flights.landed).toBeNull()
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
})
