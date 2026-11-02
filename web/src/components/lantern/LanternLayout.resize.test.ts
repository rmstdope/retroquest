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
  let listeners: Record<string, (e: { matches: boolean }) => void>
  /** The height of the newest turn in the fake layout. */
  let newestHeight: number

  beforeEach(() => {
    setActivePinia(createPinia())
    sides = false
    listeners = {}
    newestHeight = TURN_HEIGHT
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('1100px')
          ? sides
          : !query.includes('max-height'),
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
    (count - 1) * TURN_HEIGHT * scale() + newestHeight * scale()
  const topOf = (index: number): number => index * TURN_HEIGHT * scale()

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
        if (this === el) return { top: 0 } as DOMRect
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

  it('opens the column on a short newest turn, whole at the bottom', async () => {
    sides = true
    await mountWith(5)
    await readNewest()
    await cross(false)
    expect(pane().scrollTop).toBe(totalHeight(5) - PANE)
    expect(document.querySelector('.lq-more-below')).toBeNull()
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
})
