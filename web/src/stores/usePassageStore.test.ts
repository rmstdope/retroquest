import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  passageAnswer,
  usePassageStore,
  PASSAGE_HALF_MS,
  PASSAGE_WAIT_MS,
  type PassageAnswer,
  type PassagePhase,
} from './usePassageStore'

describe('usePassageStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('fades out, applies in the dark, rises, then runs up once', () => {
    const passage = usePassageStore()
    const apply = vi.fn()
    const up = vi.fn()
    passage.begin(apply, up)
    expect(passage.phase).toBe('out')
    vi.advanceTimersByTime(PASSAGE_HALF_MS - 1)
    expect(apply).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(apply).toHaveBeenCalledTimes(1)
    expect(passage.phase).toBe('in')
    expect(up).not.toHaveBeenCalled()
    vi.advanceTimersByTime(PASSAGE_HALF_MS)
    expect(passage.phase).toBe('idle')
    expect(up).toHaveBeenCalledTimes(1)
  })

  it('stays dark for a picture that is not ready, then gives it up', () => {
    const passage = usePassageStore()
    const up = vi.fn()
    passage.begin(vi.fn(), up, true)
    vi.advanceTimersByTime(PASSAGE_HALF_MS)
    expect(passage.phase).toBe('dark')
    vi.advanceTimersByTime(PASSAGE_WAIT_MS)
    expect(passage.phase).toBe('in')
    vi.advanceTimersByTime(PASSAGE_HALF_MS)
    expect(up).toHaveBeenCalledTimes(1)
  })

  it('rises at once when the picture becomes ready in the dark', () => {
    const passage = usePassageStore()
    passage.begin(vi.fn(), vi.fn(), true)
    vi.advanceTimersByTime(PASSAGE_HALF_MS)
    expect(passage.phase).toBe('dark')
    passage.pictureReady()
    expect(passage.phase).toBe('in')
  })

  it('skips mid-fade: applies, comes fully up and runs up once', () => {
    const passage = usePassageStore()
    const apply = vi.fn()
    const up = vi.fn()
    passage.begin(apply, up)
    vi.advanceTimersByTime(500)
    expect(passage.skip()).toBe(true)
    expect(apply).toHaveBeenCalledTimes(1)
    expect(up).toHaveBeenCalledTimes(1)
    expect(passage.phase).toBe('idle')
    vi.advanceTimersByTime(5000)
    expect(apply).toHaveBeenCalledTimes(1)
    expect(up).toHaveBeenCalledTimes(1)
  })

  it('skip does nothing when idle', () => {
    expect(usePassageStore().skip()).toBe(false)
  })

  it('a new begin skips the one under way', () => {
    const passage = usePassageStore()
    const first = { apply: vi.fn(), up: vi.fn() }
    passage.begin(first.apply, first.up)
    passage.begin(vi.fn(), vi.fn())
    expect(first.apply).toHaveBeenCalledTimes(1)
    expect(first.up).toHaveBeenCalledTimes(1)
    expect(passage.phase).toBe('out')
  })

  it('goes straight through with no fade when motion is reduced', () => {
    const passage = usePassageStore()
    const apply = vi.fn()
    const up = vi.fn()
    passage.begin(apply, up, false, true)
    expect(apply).toHaveBeenCalledTimes(1)
    expect(up).toHaveBeenCalledTimes(1)
    expect(passage.phase).toBe('idle')
  })

  it('reset forgets the passage without running anything', () => {
    const passage = usePassageStore()
    const up = vi.fn()
    passage.begin(vi.fn(), up)
    passage.reset()
    vi.advanceTimersByTime(5000)
    expect(up).not.toHaveBeenCalled()
    expect(passage.phase).toBe('idle')
  })

  it.each<[PassagePhase, string, PassageAnswer]>([
    ['idle', 'look', 'run'],
    ['idle', 'load', 'run'],
    ['out', 'look', 'drop'],
    ['out', '', 'drop'],
    ['out', 'load', 'runThenRise'],
    ['out', ' LOAD slot ', 'runThenRise'],
    ['out', 'loader', 'drop'],
    ['dark', 'look', 'raiseThenRun'],
    ['dark', 'load', 'runThenRise'],
    ['in', 'look', 'raiseThenRun'],
    ['in', 'load slot', 'runThenRise'],
  ])('in phase %s answers a typed "%s" with %s', (phase, line, answer) => {
    expect(passageAnswer(phase, line)).toBe(answer)
  })

  describe('typed (a command typed during a passage)', () => {
    /** A passage whose new screen is rising, and the order things happen in. */
    function rising() {
      const passage = usePassageStore()
      const order: string[] = []
      passage.begin(
        () => order.push('apply'),
        () => order.push('up'),
      )
      vi.advanceTimersByTime(PASSAGE_HALF_MS + 200)
      return { passage, order }
    }

    it('brings the screen up before a command', () => {
      const { passage, order } = rising()
      passage.typed('look', () => order.push(`run in ${passage.phase}`))
      expect(order).toEqual(['apply', 'up', 'run in idle'])
    })

    it('brings the screen up and runs a load before the passage up', () => {
      const { passage, order } = rising()
      passage.typed('load', () => order.push(`run in ${passage.phase}`))
      expect(order).toEqual(['apply', 'run in idle', 'up'])
    })

    it('drops the passage up when a load begins a passage of its own (rq-r9ax)', () => {
      const passage = usePassageStore()
      const firstUp = vi.fn()
      const secondUp = vi.fn()
      passage.begin(vi.fn(), firstUp)
      vi.advanceTimersByTime(PASSAGE_HALF_MS + 200)
      passage.typed('load', () => passage.begin(vi.fn(), secondUp))
      expect(passage.phase).toBe('out')
      vi.advanceTimersByTime(PASSAGE_HALF_MS * 2)
      expect(firstUp).not.toHaveBeenCalled()
      expect(secondUp).toHaveBeenCalledTimes(1)
    })

    it('neither runs nor skips for a command typed while the old screen fades out', () => {
      const passage = usePassageStore()
      const run = vi.fn()
      passage.begin(vi.fn(), vi.fn())
      passage.typed('look', run)
      expect(run).not.toHaveBeenCalled()
      expect(passage.phase).toBe('out')
    })

    it('just runs the command when no passage is under way', () => {
      const passage = usePassageStore()
      const run = vi.fn()
      passage.typed('load', run)
      expect(run).toHaveBeenCalledTimes(1)
      expect(passage.phase).toBe('idle')
    })
  })
})
