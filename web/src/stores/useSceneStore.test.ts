import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  useSceneStore,
  SCENE_HALF_MS,
  INTERLUDE_FADE_MS,
  INTERLUDE_RISE_MS,
} from './useSceneStore'

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

  describe('with an interlude', () => {
    const waking = { unit: 3, markup: 'The dark lets go of you.' }

    it('holds the dark, telling the interlude, until it is let go; then rises and runs onUp', () => {
      const scene = useSceneStore()
      scene.settled('a.png')
      const onUp = vi.fn()
      scene.begin(4, 'b.png', onUp, 3, waking)
      expect(scene.interlude).toBeNull()
      scene.targetReady(true)
      vi.advanceTimersByTime(SCENE_HALF_MS)
      expect(scene.phase).toBe('dark')
      expect(scene.interlude).toEqual({ turn: 4, ...waking })
      // The interlude's own words are let through; what comes after waits.
      expect(scene.holds(4, 3)).toBe(false)
      expect(scene.holds(4, 4)).toBe(true)
      vi.advanceTimersByTime(SCENE_HALF_MS * 5)
      expect(scene.phase).toBe('dark')
      scene.endInterlude()
      expect(scene.interlude).toBeNull()
      // The words fade out in the dark before the new picture rises.
      expect(scene.phase).toBe('dark')
      vi.advanceTimersByTime(INTERLUDE_FADE_MS - 1)
      expect(scene.phase).toBe('dark')
      vi.advanceTimersByTime(1)
      expect(scene.phase).toBe('in')
      // Out of the told dark, the new picture rises slowly.
      expect(scene.riseMs).toBe(INTERLUDE_RISE_MS)
      vi.advanceTimersByTime(INTERLUDE_RISE_MS - 1)
      expect(scene.phase).toBe('in')
      expect(onUp).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(scene.phase).toBe('idle')
      expect(onUp).toHaveBeenCalledTimes(1)
    })

    it('rises at the usual pace again on the next change, without an interlude', () => {
      const scene = useSceneStore()
      scene.settled('a.png')
      scene.begin(4, 'b.png', () => {}, 3, waking)
      scene.targetReady(true)
      vi.advanceTimersByTime(SCENE_HALF_MS)
      scene.endInterlude()
      vi.advanceTimersByTime(INTERLUDE_FADE_MS + INTERLUDE_RISE_MS)
      expect(scene.phase).toBe('idle')
      scene.begin(5, 'c.png', () => {})
      scene.targetReady(true)
      vi.advanceTimersByTime(SCENE_HALF_MS)
      expect(scene.phase).toBe('in')
      expect(scene.riseMs).toBe(SCENE_HALF_MS)
    })

    it('rises when the picture loads after the interlude was let go', () => {
      const scene = useSceneStore()
      scene.settled('a.png')
      scene.begin(4, 'b.png', () => {}, 3, waking)
      vi.advanceTimersByTime(SCENE_HALF_MS)
      // The picture is slow (its patches are still loading).
      scene.awaitMore(5 * SCENE_HALF_MS)
      scene.endInterlude()
      vi.advanceTimersByTime(INTERLUDE_FADE_MS)
      expect(scene.phase).toBe('dark')
      scene.targetReady(true)
      expect(scene.phase).toBe('in')
    })

    it('does not rise while the words fade, even when the picture loads then', () => {
      const scene = useSceneStore()
      scene.settled('a.png')
      scene.begin(4, 'b.png', () => {}, 3, waking)
      vi.advanceTimersByTime(SCENE_HALF_MS)
      scene.endInterlude()
      scene.targetReady(true)
      expect(scene.phase).toBe('dark')
      vi.advanceTimersByTime(INTERLUDE_FADE_MS)
      expect(scene.phase).toBe('in')
    })

    it('ends with the change when the room is brought up at once', () => {
      const scene = useSceneStore()
      scene.settled('a.png')
      const onUp = vi.fn()
      scene.begin(4, 'b.png', onUp, 3, waking)
      vi.advanceTimersByTime(SCENE_HALF_MS)
      scene.skip()
      expect(scene.interlude).toBeNull()
      expect(scene.phase).toBe('idle')
      expect(onUp).toHaveBeenCalledTimes(1)
    })
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

  describe('awaitMore', () => {
    it('gives a loaded picture more time in the dark before it is given up', () => {
      const scene = useSceneStore()
      scene.begin(1, '/b.png', () => {})
      vi.advanceTimersByTime(SCENE_HALF_MS + 500)
      expect(scene.phase).toBe('dark')
      scene.awaitMore(SCENE_HALF_MS * 2)
      vi.advanceTimersByTime(SCENE_HALF_MS + 600)
      expect(scene.ready).toBeNull()
      scene.targetReady(true)
      expect(scene.phase).toBe('in')
    })

    it('does nothing when no change of scene is under way', () => {
      const scene = useSceneStore()
      scene.awaitMore(10)
      expect(scene.phase).toBe('idle')
    })

    it('asked while the old picture is still fading out, the extra time is spent in the dark', () => {
      const scene = useSceneStore()
      scene.begin(1, '/b.png', () => {})
      vi.advanceTimersByTime(200)
      scene.awaitMore(SCENE_HALF_MS * 2)
      vi.advanceTimersByTime(SCENE_HALF_MS - 200)
      expect(scene.phase).toBe('dark')
      vi.advanceTimersByTime(SCENE_HALF_MS + 600)
      expect(scene.phase).toBe('dark')
      expect(scene.ready).toBeNull()
    })

    it('is forgotten by the next change of scene', () => {
      const scene = useSceneStore()
      scene.begin(1, '/b.png', () => {})
      scene.awaitMore(SCENE_HALF_MS * 5)
      scene.skip()
      scene.begin(2, '/c.png', () => {})
      vi.advanceTimersByTime(SCENE_HALF_MS * 3)
      expect(scene.ready).toBe(false)
    })
  })

  it('ends its timers when its scope is disposed', () => {
    const scene = useSceneStore()
    scene.settled('a.png')
    const onUp = vi.fn()
    scene.begin(4, 'b.png', onUp)
    scene.targetReady(true)
    scene.$dispose()
    vi.advanceTimersByTime(SCENE_HALF_MS * 3)
    expect(scene.phase).toBe('out')
    expect(onUp).not.toHaveBeenCalled()
  })
})
