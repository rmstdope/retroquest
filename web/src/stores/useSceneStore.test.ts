import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSceneStore, SCENE_HALF_MS } from './useSceneStore'

describe('useSceneStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('goes dark for a second, rises for a second, then runs onUp once', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    const onUp = vi.fn()
    scene.begin(4, 'b.png', onUp)
    expect(scene.phase).toBe('out')
    expect(scene.holds(4, 0)).toBe(true)
    scene.targetReady(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    expect(scene.phase).toBe('in')
    expect(onUp).not.toHaveBeenCalled()
    vi.advanceTimersByTime(SCENE_HALF_MS)
    expect(scene.phase).toBe('idle')
    expect(scene.holds(4, 0)).toBe(false)
    expect(scene.shown).toBe('b.png')
    expect(onUp).toHaveBeenCalledTimes(1)
  })

  it('holds only the words from unit `from` on when the change starts partway through a turn', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    scene.begin(4, 'b.png', () => {}, 3)
    expect(scene.holds(4, 2)).toBe(false)
    expect(scene.holds(4, -1)).toBe(false)
    expect(scene.holds(4, 3)).toBe(true)
    expect(scene.holds(4, 5)).toBe(true)
    scene.skip()
    expect(scene.holds(4, 3)).toBe(false)
  })

  it("holds every word of the turn, also Elior's own, when the change starts with it", () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    scene.begin(4, 'b.png', () => {})
    expect(scene.holds(4, -1)).toBe(true)
    expect(scene.holds(4, 0)).toBe(true)
  })

  it("remembers where a talk's new room begins until the next cut or a reset", () => {
    const scene = useSceneStore()
    expect(scene.firstUnit(4)).toBeNull()
    scene.cut(4, 3)
    expect(scene.firstUnit(4)).toBe(3)
    expect(scene.firstUnit(5)).toBeNull()
    scene.cut(9, 0)
    expect(scene.firstUnit(4)).toBeNull()
    expect(scene.firstUnit(9)).toBe(0)
    scene.reset()
    expect(scene.firstUnit(9)).toBeNull()
  })

  it('stays dark for a picture slow to load, then gives the backdrop', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    scene.begin(1, 'b.png', () => {})
    vi.advanceTimersByTime(SCENE_HALF_MS)
    expect(scene.phase).toBe('dark')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    expect(scene.phase).toBe('in')
    expect(scene.target).toBe('')
  })

  it('rises as soon as a late picture is ready', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    scene.begin(1, 'b.png', () => {})
    vi.advanceTimersByTime(SCENE_HALF_MS)
    scene.targetReady(true)
    expect(scene.phase).toBe('in')
    expect(scene.target).toBe('b.png')
  })

  it('a missing target (or none) rises as the backdrop', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    scene.begin(1, 'b.png', () => {})
    scene.targetReady(false)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    expect(scene.target).toBe('')
    expect(scene.phase).toBe('in')
  })

  it('skip brings the new room up at once and runs onUp once', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    const onUp = vi.fn()
    scene.begin(2, 'b.png', onUp)
    scene.skip()
    expect(scene.phase).toBe('idle')
    expect(scene.shown).toBe('b.png')
    expect(onUp).toHaveBeenCalledTimes(1)
    scene.skip()
    vi.advanceTimersByTime(5000)
    expect(onUp).toHaveBeenCalledTimes(1)
  })

  it('reports the darkest moment', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    expect(scene.darkTurn).toBe(null)
    scene.begin(3, 'b.png', () => {})
    scene.targetReady(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    expect(scene.darkTurn).toBe(3)
  })

  it('reset forgets the picture and any change', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    const onUp = vi.fn()
    scene.begin(2, 'b.png', onUp)
    scene.reset()
    expect(scene.shown).toBe(null)
    expect(scene.holds(2, 0)).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(onUp).not.toHaveBeenCalled()
  })
})
