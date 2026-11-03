import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  FLIGHT_FLY_MS,
  FLIGHT_HOLD_MS,
  FLIGHT_LAND_MS,
  FLIGHT_SHOW_MS,
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
})
