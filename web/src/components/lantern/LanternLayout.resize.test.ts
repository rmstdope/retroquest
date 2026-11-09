// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'

/** A turn that tells `text`. */
function turn(id: number, text: string): Turn {
  return {
    id,
    command: 'look',
    text,
    room: 'Square',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
  }
}

/** Height of the story pane, and of every turn but the last, in the fake layout. */
const PANE = 300
const TURN_HEIGHT = 100

describe('where the story lands after the window crosses 1100 px', () => {
  let w: VueWrapper | undefined
  let sides: boolean
  /** Whether the window is a laptop's (at least 1024 by 560 px). */
  let wide: boolean
  /** Whether the window is short (under 520 px high): the transcript layout under the laptop stage. */
  let short: boolean
  let listeners: Record<string, (e: { matches: boolean }) => void>
  /** The height of the newest turn in the fake layout. */
  let newestHeight: number
  /** How much taller the oldest turn has grown since the crossing was first measured. */
  let extra: number
  /** Room the pane gains at its end (padding) without any element changing size. */
  let trailing: number
  /** The callbacks of the ResizeObservers the layout made. */
  let observers: Array<() => void>

  beforeEach(() => {
    setActivePinia(createPinia())
    observers = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          observers.push(callback)
        }
        observe(): void {}
        disconnect(): void {}
      },
    )
    sides = false
    wide = true
    short = false
    listeners = {}
    newestHeight = TURN_HEIGHT
    extra = 0
    trailing = 0
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('hover: none')
          ? false
          : query.includes('1100px')
            ? sides
            : query.includes('519px')
              ? short
              : query.includes('min-height')
                ? wide
                : true,
        addEventListener: (
          _: string,
          fn: (e: { matches: boolean }) => void,
        ) => {
          listeners[query] = fn
        },
        removeEventListener: vi.fn(),
      })),
    )
  })
  afterEach(() => {
    window.innerWidth = 1024
    window.innerHeight = 768
    vi.useRealTimers()
    w?.unmount()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const pane = (): HTMLElement =>
    document.querySelector('section[aria-label="Story"]') as HTMLElement
  const content = (): HTMLElement =>
    document.querySelector('.lq-paper-content') as HTMLElement
  /** The cards of the two sides, as drawn now, are twice as tall as the column's lines. */
  const scale = (): number => (document.querySelector('.lq-one-column') ? 1 : 2)
  const heightOf = (index: number, count: number): number =>
    (index === count - 1 ? newestHeight : TURN_HEIGHT) * scale()
  const totalHeight = (count: number): number =>
    (count - 1) * TURN_HEIGHT * scale() +
    newestHeight * scale() +
    extra +
    trailing
  const topOf = (index: number): number =>
    index * TURN_HEIGHT * scale() + (index > 0 ? extra : 0)

  /** Lay the pane and its turns out by hand (jsdom has no layout). */
  function layOut(): void {
    const el = pane()
    Object.defineProperty(el, 'clientHeight', {
      configurable: true,
      value: PANE,
    })
    Object.defineProperty(el, 'scrollHeight', {
      configurable: true,
      get: () => totalHeight(content().children.length),
    })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element): DOMRect {
        if (this === el) return { top: 0, bottom: PANE } as DOMRect
        if (this.classList.contains('lq-w-now'))
          return {
            top: 4 * TURN_HEIGHT * scale() + 700 - el.scrollTop,
            bottom: 4 * TURN_HEIGHT * scale() + 720 - el.scrollTop,
            height: 20,
          } as DOMRect
        const kids = Array.from(content().children)
        const index = kids.indexOf(this)
        if (index < 0) return { top: 0, height: 0 } as DOMRect
        return {
          top: topOf(index) - el.scrollTop,
          bottom: topOf(index) - el.scrollTop + heightOf(index, kids.length),
          height: heightOf(index, kids.length),
        } as DOMRect
      },
    )
  }

  async function mountWith(count: number): Promise<void> {
    useGameStore().turns = Array.from({ length: count }, (_, i) =>
      turn(i + 1, `Turn ${i + 1}.`),
    )
    w = mount(LanternLayout, { attachTo: document.body })
    await nextTick()
    layOut()
  }

  /** Cross 1100 px, then lay out the freshly drawn turns. */
  async function cross(toSides: boolean): Promise<void> {
    sides = toSides
    for (const [query, fn] of Object.entries(listeners))
      if (query.includes('1100px')) fn({ matches: toSides })
    await nextTick()
    await nextTick()
  }

  /** The player reads the newest turn: its start at the top, or the bottom for a short one. */
  async function readNewest(): Promise<void> {
    pane().scrollTop = Math.min(topOf(4), totalHeight(5) - PANE)
    pane().dispatchEvent(new Event('scroll'))
  }

  it('ends the cards above the action row a frame after the row changes height, not while its change is delivered', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) =>
      frames.push(run),
    )
    sides = true
    await mountWith(1)
    const row = document.querySelector('.lq-composer') as HTMLElement
    Object.defineProperty(row, 'offsetHeight', {
      configurable: true,
      value: 61,
    })
    const wrap = document.querySelector('.lq-story-wrap') as HTMLElement
    // Resizing the observed column inside the callback loops the observers.
    observers.forEach((notify) => notify())
    await nextTick()
    expect(wrap.style.bottom).not.toContain('61px')
    frames.splice(0).forEach((run) => run(0))
    await nextTick()
    expect(wrap.style.bottom).toContain('61px')
  })

  it('tells the stage how wide its buttons stand, a frame after they change width', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) =>
      frames.push(run),
    )
    await mountWith(1)
    const buttons = document.querySelector('.lq-stage-buttons') as HTMLElement
    Object.defineProperty(buttons, 'offsetWidth', {
      configurable: true,
      value: 327,
    })
    observers.forEach((notify) => notify())
    frames.splice(0).forEach((run) => run(0))
    await nextTick()
    const stage = document.querySelector('.lq-stage') as HTMLElement
    expect(stage.style.getPropertyValue('--lq-stage-buttons-w')).toBe('327px')
  })

  it('opens the column on a short newest turn, whole at the bottom', async () => {
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    expect(pane().scrollTop).toBe(totalHeight(5) - PANE)
    expect(document.querySelector('.lq-more-below')).toBeNull()
  })

  it('opens the column on the newest for a player who rested at the bottom, whatever the browser did to the old layout first', async () => {
    sides = true
    await mountWith(5)
    await readNewest()
    // The browser re-lays the old cards at the new width and moves the pane before the crossing is noticed.
    window.innerWidth = 420
    pane().scrollTop = 40
    pane().dispatchEvent(new Event('scroll'))
    await cross(false)
    expect(pane().scrollTop).toBe(totalHeight(5) - PANE)
    expect(document.querySelector('.lq-more-below')).toBeNull()
  })

  it('takes the view again once the window size has settled', async () => {
    vi.useFakeTimers()
    newestHeight = 900
    sides = true
    await mountWith(5)
    await readNewest()
    window.innerWidth = 420
    pane().dispatchEvent(new Event('scroll')) // the size changed: frozen
    vi.advanceTimersByTime(1000) // settled: the view is taken at the new size
    pane().scrollTop = topOf(1)
    pane().dispatchEvent(new Event('scroll'))
    await cross(false)
    expect(pane().scrollTop).toBe(topOf(1))
    vi.useRealTimers()
  })

  it('keeps a scrolled-back player in place whatever the browser did to the old layout first', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    pane().scrollTop = topOf(1)
    pane().dispatchEvent(new Event('scroll'))
    window.innerWidth = 420
    pane().scrollTop = topOf(3) + 20
    pane().dispatchEvent(new Event('scroll'))
    await cross(false)
    expect(pane().scrollTop).toBe(topOf(1))
  })

  it('opens the column on a long newest turn at its start', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    expect(pane().scrollTop).toBe(topOf(4))
    expect(document.querySelector('.lq-more-below')).not.toBeNull()
  })

  it('opens the sides on the newest turn from its start when widening', async () => {
    newestHeight = 900
    await mountWith(5)
    await readNewest()
    await cross(true)
    expect(pane().scrollTop).toBe(topOf(4))
  })

  it('keeps the older turn in view for a player who had scrolled back', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    pane().scrollTop = topOf(1) // the second turn is at the top of the view
    pane().dispatchEvent(new Event('scroll'))
    await cross(false)
    expect(pane().scrollTop).toBe(topOf(1))
  })

  it('settles on the newest after several crossings in a row', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    await cross(true)
    await cross(false)
    expect(pane().scrollTop).toBe(topOf(4))
  })

  it('keeps a turn the player was part-way into in view when it shrinks', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    // Three quarters into the second card (200 px tall on the two sides).
    pane().scrollTop = topOf(1) + 150
    pane().dispatchEvent(new Event('scroll'))
    await cross(false)
    const top = topOf(1)
    expect(pane().scrollTop).toBeGreaterThanOrEqual(top)
    expect(pane().scrollTop).toBeLessThan(top + TURN_HEIGHT)
    expect(document.querySelector('.lq-more-below')).not.toBeNull()
  })

  it('follows the lit word of a reading in progress after the crossing', async () => {
    newestHeight = 900
    sides = true
    const reading = ref(false)
    Object.defineProperty(useNarrationStore(), 'storyReading', {
      configurable: true,
      get: () => reading.value,
    })
    await mountWith(5)
    const word = document.createElement('span')
    word.className = 'lq-w-now'
    pane().appendChild(word)
    await readNewest()
    reading.value = true
    await cross(false)
    // The word sits 700 px into the newest turn: it is in view, near the bottom.
    const wordTop = topOf(4) + 700
    expect(pane().scrollTop).toBeGreaterThan(wordTop - PANE)
    expect(pane().scrollTop).toBeLessThanOrEqual(wordTop)
  })

  /** The browser finishes laying the crossing out: sizes change, observers fire. */
  function settle(): void {
    for (const callback of observers) callback()
  }

  it('lands a short newest turn at the bottom once the layout has settled', async () => {
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    // The turns grow after the crossing was first measured.
    newestHeight = 190
    settle()
    expect(pane().scrollTop).toBe(totalHeight(5) - PANE)
    expect(document.querySelector('.lq-more-below')).toBeNull()
  })

  it('lands a short newest turn at the very bottom when only the room at the end grows', async () => {
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    // The end padding settles later; no observer fires, the browser only paints a frame.
    trailing = 56
    await new Promise<void>((done) => requestAnimationFrame(() => done()))
    await new Promise<void>((done) => requestAnimationFrame(() => done()))
    expect(pane().scrollTop).toBe(totalHeight(5) - PANE)
  })

  /** One animation frame passes. */
  function frame(): Promise<void> {
    return new Promise<void>((done) => requestAnimationFrame(() => done()))
  }

  it('keeps a long newest turn at its start when only the room at the end grows', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    trailing = 56
    await frame()
    await frame()
    expect(pane().scrollTop).toBe(topOf(4))
  })

  it('does not pull the story back on a frame once the player has scrolled away', async () => {
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    const where = topOf(2)
    pane().scrollTop = where
    pane().dispatchEvent(new Event('wheel'))
    trailing = 56
    await frame()
    await frame()
    expect(pane().scrollTop).toBe(where)
  })

  it('keeps a long newest turn at its start once the layout has settled', async () => {
    newestHeight = 900
    await mountWith(5)
    await readNewest()
    await cross(true)
    // An older turn grows after the crossing: the newest turn's start moves down.
    extra = 80
    settle()
    expect(pane().scrollTop).toBe(topOf(4))
  })

  it('stops landing once the player has scrolled away from it', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    const where = topOf(2)
    pane().scrollTop = where
    pane().dispatchEvent(new Event('wheel'))
    extra = 80
    settle()
    expect(pane().scrollTop).toBe(where)
  })

  it('stops landing once the player presses a scrolling key', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    pane().dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }))
    const where = pane().scrollTop
    extra = 80
    settle()
    expect(pane().scrollTop).toBe(where)
  })

  it('stops landing once the layout has had time to settle', async () => {
    vi.useFakeTimers()
    try {
      newestHeight = 900
      sides = true
      await mountWith(5)
      await readNewest()
      await cross(false)
      const where = pane().scrollTop
      vi.advanceTimersByTime(700)
      extra = 80
      settle()
      expect(pane().scrollTop).toBe(where)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops landing when a new turn arrives', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    useGameStore().turns = [...useGameStore().turns, turn(6, 'Turn 6.')]
    await nextTick()
    await nextTick()
    pane().scrollTop = 7
    extra = 80
    settle()
    expect(pane().scrollTop).toBe(7)
  })

  it('keeps the older turn in view for a player who had scrolled back, after settling', async () => {
    newestHeight = 900
    sides = true
    await mountWith(5)
    pane().scrollTop = topOf(1)
    pane().dispatchEvent(new Event('scroll'))
    await cross(false)
    extra = 80
    settle()
    expect(pane().scrollTop).toBe(topOf(1))
  })

  /** Change the window to `width` by `height`, and tell the layout which of its sizes that is. */
  async function resizeTo(width: number, height: number): Promise<void> {
    window.innerWidth = width
    window.innerHeight = height
    wide = width >= 1024 && height >= 560
    short = height < 520
    for (const [query, fn] of Object.entries(listeners)) {
      if (query.includes('519px')) fn({ matches: short })
      else if (query.includes('min-height')) fn({ matches: wide })
    }
    await nextTick()
    await nextTick()
  }

  it('opens the transcript on the newest turn when the window becomes short', async () => {
    wide = false
    window.innerWidth = 900
    window.innerHeight = 757
    await mountWith(5)
    await readNewest()
    await resizeTo(900, 480)
    expect(content().children.length).toBe(5)
    expect(pane().scrollTop).toBe(totalHeight(5) - PANE)
  })

  it('opens the transcript on the newest turn when a laptop window becomes short', async () => {
    newestHeight = 900
    window.innerWidth = 1024
    window.innerHeight = 768
    await mountWith(5)
    await readNewest()
    await resizeTo(1024, 480)
    expect(content().children.length).toBe(5)
    expect(pane().scrollTop).toBe(topOf(4))
  })

  it('opens the transcript on the newest turn when the stage showed no card', async () => {
    window.innerWidth = 1024
    window.innerHeight = 768
    useGameStore().turns = Array.from({ length: 5 }, (_, i) => turn(i + 1, ''))
    w = mount(LanternLayout, { attachTo: document.body })
    await nextTick()
    layOut()
    expect(content().children.length).toBe(0)
    await resizeTo(1024, 480)
    expect(content().children.length).toBe(5)
    expect(pane().scrollTop).toBe(totalHeight(5) - PANE)
  })

  it('leaves a player scrolled back on the stage where the transcript opens', async () => {
    newestHeight = 900
    window.innerWidth = 1024
    window.innerHeight = 768
    await mountWith(5)
    const where = topOf(1)
    pane().scrollTop = where
    pane().dispatchEvent(new Event('scroll'))
    await resizeTo(1024, 480)
    expect(content().children.length).toBe(5)
    expect(pane().scrollTop).toBe(where)
  })

  it('leaves the stage to place its card when a short window grows tall again', async () => {
    wide = false
    short = true
    window.innerWidth = 900
    window.innerHeight = 480
    await mountWith(5)
    await readNewest()
    pane().scrollTop = 150
    await resizeTo(900, 757)
    expect(document.querySelector('.lq-cards')).not.toBeNull()
    expect(pane().scrollTop).toBe(150)
  })
})
