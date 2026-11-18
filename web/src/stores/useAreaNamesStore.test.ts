import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAreaNamesStore } from './useAreaNamesStore'
import { useGameStore } from './useGameStore'

describe('useAreaNamesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts off, comes in on input and leaves 4 seconds after the last one', () => {
    const names = useAreaNamesStore()
    expect(names.showing).toBe(false)
    names.bump()
    expect(names.showing).toBe(true)
    vi.advanceTimersByTime(3999)
    expect(names.showing).toBe(true)
    vi.advanceTimersByTime(1)
    expect(names.showing).toBe(false)
  })

  it('every new input starts the 4 seconds again, and brings them back after they left', () => {
    const names = useAreaNamesStore()
    names.bump()
    vi.advanceTimersByTime(3000)
    names.bump()
    vi.advanceTimersByTime(3000)
    expect(names.showing).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(names.showing).toBe(false)
    names.bump()
    expect(names.showing).toBe(true)
  })

  it('turnOff takes them away at once and cancels the wait', () => {
    const names = useAreaNamesStore()
    names.bump()
    names.turnOff()
    expect(names.showing).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('starts afresh in the next room, after a load and after a new act', async () => {
    const game = useGameStore()
    const names = useAreaNamesStore()
    names.bump()
    game.roomName = 'Somewhere else'
    await nextTick()
    expect(names.showing).toBe(false)
    names.bump()
    game.loadNumber++
    await nextTick()
    expect(names.showing).toBe(false)
    names.bump()
    game.gameNumber++
    await nextTick()
    expect(names.showing).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('forgets the pointer in the next room', async () => {
    const game = useGameStore()
    const names = useAreaNamesStore()
    names.pointer = { x: 4, y: 5 }
    game.roomName = 'Elsewhere'
    await nextTick()
    expect(names.pointer).toBeNull()
  })
})
