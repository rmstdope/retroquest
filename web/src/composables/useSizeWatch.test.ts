// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useSizeWatch } from './useSizeWatch'

/** A stand-in size observer the test reports sizes through by hand. */
class StubObserver {
  static all: StubObserver[] = []
  targets = new Set<Element>()
  disconnected = false
  constructor(private readonly callback: () => void) {
    StubObserver.all.push(this)
  }
  observe(el: Element): void {
    this.targets.add(el)
  }
  unobserve(el: Element): void {
    this.targets.delete(el)
  }
  disconnect(): void {
    this.targets.clear()
    this.disconnected = true
  }
  /** The browser reports sizes. */
  report(): void {
    this.callback()
  }
}

describe('useSizeWatch', () => {
  let frames: Array<() => void>
  const runFrame = (): void => {
    const now = frames
    frames = []
    for (const fn of now) fn()
  }

  beforeEach(() => {
    StubObserver.all = []
    frames = []
    vi.stubGlobal('ResizeObserver', StubObserver)
    vi.stubGlobal('requestAnimationFrame', (fn: () => void): number => {
      frames.push(fn)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
      frames[id - 1] = () => undefined
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('does its work on the next frame, never inside the size report', () => {
    const work = vi.fn()
    const watch = useSizeWatch(work)
    watch.observe(document.createElement('div'))
    StubObserver.all[0].report()
    expect(work).not.toHaveBeenCalled()
    runFrame()
    expect(work).toHaveBeenCalledOnce()
  })

  it('does its work once a frame however many reports come', () => {
    const work = vi.fn()
    const watch = useSizeWatch(work)
    watch.observe(document.createElement('div'))
    StubObserver.all[0].report()
    StubObserver.all[0].report()
    runFrame()
    expect(work).toHaveBeenCalledOnce()
  })

  it('does its work inside the report when asked to', () => {
    const work = vi.fn()
    const watch = useSizeWatch(work, { inReport: true })
    watch.observe(document.createElement('div'))
    StubObserver.all[0].report()
    expect(work).toHaveBeenCalledOnce()
  })

  it('holds a target added during a report until the next frame', () => {
    const late = document.createElement('div')
    const watch = useSizeWatch(() => watch.observe(late), { inReport: true })
    watch.observe(document.createElement('div'))
    StubObserver.all[0].report()
    expect(StubObserver.all[0].targets.has(late)).toBe(false)
    runFrame()
    expect(StubObserver.all[0].targets.has(late)).toBe(true)
  })

  it('adds a target at once when no report is being delivered', () => {
    const el = document.createElement('div')
    useSizeWatch(() => undefined).observe(el)
    expect(StubObserver.all[0].targets.has(el)).toBe(true)
  })

  it('retargets: the old targets go and a pending frame is cancelled', () => {
    const work = vi.fn()
    const a = document.createElement('div')
    const b = document.createElement('div')
    const watch = useSizeWatch(work)
    watch.observe(a)
    StubObserver.all[0].report()
    watch.retarget(b)
    runFrame()
    expect(work).not.toHaveBeenCalled()
    expect([...StubObserver.all[0].targets]).toEqual([b])
    watch.retarget()
    expect(StubObserver.all[0].targets.size).toBe(0)
  })

  it('unobserves a target', () => {
    const el = document.createElement('div')
    const watch = useSizeWatch(() => undefined)
    watch.observe(el)
    watch.unobserve(el)
    expect(StubObserver.all[0].targets.size).toBe(0)
  })

  it('stops: disconnects and drops the pending frame', () => {
    const work = vi.fn()
    const watch = useSizeWatch(work)
    watch.observe(document.createElement('div'))
    StubObserver.all[0].report()
    watch.stop()
    runFrame()
    expect(work).not.toHaveBeenCalled()
    expect(StubObserver.all[0].disconnected).toBe(true)
  })

  it('stops with the scope it was made in', () => {
    const scope = effectScope()
    const watch = scope.run(() => useSizeWatch(() => undefined))
    watch?.observe(document.createElement('div'))
    scope.stop()
    expect(StubObserver.all[0].disconnected).toBe(true)
  })

  it('does nothing where there is no ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const watch = useSizeWatch(vi.fn())
    expect(() => {
      watch.observe(document.createElement('div'))
      watch.retarget()
      watch.stop()
    }).not.toThrow()
  })
})
