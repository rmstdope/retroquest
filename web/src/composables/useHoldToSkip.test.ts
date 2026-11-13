// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import {
  HOLD_RING_MS,
  HOLD_SLOP_PX,
  HOLD_TO_SKIP_MS,
  useHoldToSkip,
  type HoldToSkip,
} from './useHoldToSkip'

describe('useHoldToSkip', () => {
  let telling: boolean
  let skip: ReturnType<typeof vi.fn<() => void>>
  let clicks: number
  let hold: HoldToSkip
  let w: VueWrapper

  /** A host with a stage to press on, a button that keeps its own presses, and a thing's button on the picture. */
  function host(): VueWrapper {
    const Host = defineComponent({
      setup() {
        hold = useHoldToSkip({
          root: () => document.querySelector('.root'),
          telling: () => telling,
          skip: () => skip(),
        })
        return () =>
          h('div', { class: 'root' }, [
            h('div', { class: 'stage', onClick: () => clicks++ }),
            h('button', { class: 'verb', onClick: () => clicks++ }),
            h('button', {
              class: 'thing',
              'data-area-press': 'man',
              onClick: () => clicks++,
            }),
          ])
      },
    })
    return mount(Host, { attachTo: document.body })
  }

  /** Dispatch a pointer event of `type` on `target` at (x, y). */
  function pointer(type: string, target: Element, x = 100, y = 50): void {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        isPrimary: true,
        pointerId: 1,
        clientX: x,
        clientY: y,
      }),
    )
  }

  /** Press and let go on `target` after `ms`, as a browser does (the click follows the release). */
  async function press(target: Element, ms: number): Promise<void> {
    pointer('pointerdown', target)
    vi.advanceTimersByTime(ms)
    await nextTick()
    pointer('pointerup', target)
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
  }

  beforeEach(() => {
    vi.useFakeTimers()
    telling = true
    skip = vi.fn()
    clicks = 0
    w = host()
  })
  afterEach(() => {
    w.unmount()
    vi.useRealTimers()
  })

  const stage = (): Element => document.querySelector('.stage')!

  it('lets a quick press through as an ordinary click (one step)', async () => {
    await press(stage(), 80)
    expect(skip).not.toHaveBeenCalled()
    expect(clicks).toBe(1)
    expect(hold.ring.value).toBeNull()
  })

  it('shows the ring where the press is held, once it has been held a moment', async () => {
    pointer('pointerdown', stage(), 120, 60)
    vi.advanceTimersByTime(HOLD_RING_MS - 1)
    await nextTick()
    expect(hold.ring.value).toBeNull()
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(hold.ring.value).toEqual({ x: 120, y: 60 })
  })

  it('skips everything when held long enough, and swallows the click of the release', async () => {
    await press(stage(), HOLD_TO_SKIP_MS)
    expect(skip).toHaveBeenCalledTimes(1)
    expect(clicks).toBe(0)
    expect(hold.ring.value).toBeNull()
  })

  it('does nothing when let go once the ring shows but before it is full: no skip and no step', async () => {
    await press(stage(), HOLD_RING_MS + 100)
    expect(skip).not.toHaveBeenCalled()
    expect(clicks).toBe(0)
    expect(hold.ring.value).toBeNull()
    // The next quick press is a step again.
    await press(stage(), 50)
    expect(clicks).toBe(1)
  })

  it('gives up the hold when the press moves away (a scroll or a drag)', async () => {
    pointer('pointerdown', stage(), 100, 50)
    pointer('pointermove', stage(), 100, 50 + HOLD_SLOP_PX + 1)
    vi.advanceTimersByTime(HOLD_TO_SKIP_MS)
    await nextTick()
    expect(skip).not.toHaveBeenCalled()
    expect(hold.ring.value).toBeNull()
  })

  it('skips nothing when the telling ended while the press was held', async () => {
    pointer('pointerdown', stage())
    telling = false
    vi.advanceTimersByTime(HOLD_TO_SKIP_MS)
    await nextTick()
    expect(skip).not.toHaveBeenCalled()
    expect(hold.ring.value).toBeNull()
  })

  it('swallows no later click when the release of a hold makes none (a long touch)', async () => {
    pointer('pointerdown', stage())
    vi.advanceTimersByTime(HOLD_TO_SKIP_MS)
    pointer('pointerup', stage())
    vi.advanceTimersByTime(10)
    // A click made later, by the keyboard on a button, is its own.
    ;(document.querySelector('.verb') as HTMLButtonElement).click()
    expect(skip).toHaveBeenCalledTimes(1)
    expect(clicks).toBe(1)
  })

  it('does not hold while nothing is being told', async () => {
    telling = false
    await press(stage(), HOLD_TO_SKIP_MS)
    expect(skip).not.toHaveBeenCalled()
    expect(clicks).toBe(1)
  })

  it('leaves a button its own press', async () => {
    await press(document.querySelector('.verb')!, HOLD_TO_SKIP_MS)
    expect(skip).not.toHaveBeenCalled()
    expect(clicks).toBe(1)
  })

  it('skips when a thing on the picture is held, since its button does nothing while the story is told (rq-w30z)', async () => {
    await press(document.querySelector('.thing')!, HOLD_TO_SKIP_MS)
    expect(skip).toHaveBeenCalledTimes(1)
    expect(clicks).toBe(0)
  })

  it('leaves a thing on the picture its own press while nothing is told', async () => {
    telling = false
    await press(document.querySelector('.thing')!, HOLD_TO_SKIP_MS)
    expect(skip).not.toHaveBeenCalled()
    expect(clicks).toBe(1)
  })

  it('ignores a move or a release with no press held, whatever its pointer', () => {
    const bare = (type: string): void => {
      stage().dispatchEvent(new MouseEvent(type, { bubbles: true }))
    }
    expect(() => {
      bare('pointermove')
      bare('pointerup')
      bare('pointercancel')
    }).not.toThrow()
    expect(skip).not.toHaveBeenCalled()
  })

  it('keeps the phone from opening its own menu on a long press', () => {
    pointer('pointerdown', stage())
    const menu = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    })
    stage().dispatchEvent(menu)
    expect(menu.defaultPrevented).toBe(true)
  })

  describe('a held key', () => {
    it('skips everything when held long enough, with the ring where it is put', async () => {
      hold.keyDown('Enter', { x: 300, y: 200 })
      expect(hold.keyHeld('Enter')).toBe(true)
      vi.advanceTimersByTime(HOLD_RING_MS)
      await nextTick()
      expect(hold.ring.value).toEqual({ x: 300, y: 200 })
      vi.advanceTimersByTime(HOLD_TO_SKIP_MS - HOLD_RING_MS)
      expect(skip).toHaveBeenCalledTimes(1)
      expect(hold.ring.value).toBeNull()
      // The key is still down: its repeats are still the hold's, so they take no step.
      expect(hold.keyHeld('Enter')).toBe(true)
      hold.keyUp('Enter')
      expect(hold.keyHeld('Enter')).toBe(false)
    })

    it('is given up when the key is let go early', () => {
      hold.keyDown(' ', null)
      vi.advanceTimersByTime(HOLD_TO_SKIP_MS - 1)
      hold.keyUp(' ')
      vi.advanceTimersByTime(10)
      expect(skip).not.toHaveBeenCalled()
      expect(hold.keyHeld(' ')).toBe(false)
    })
  })
})
