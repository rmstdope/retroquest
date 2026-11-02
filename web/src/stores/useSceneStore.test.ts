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
    expect(scene.holds(4)).toBe(true)
    scene.targetReady(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    expect(scene.phase).toBe('in')
    expect(onUp).not.toHaveBeenCalled()
    vi.advanceTimersByTime(SCENE_HALF_MS)
    expect(scene.phase).toBe('idle')
    expect(scene.holds(4)).toBe(false)
    expect(scene.shown).toBe('b.png')
    expect(onUp).toHaveBeenCalledTimes(1)
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
    expect(scene.holds(2)).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(onUp).not.toHaveBeenCalled()
  })
})
