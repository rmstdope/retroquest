// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, type Ref } from 'vue'
import { useFadeOnceRead } from './useFadeOnceRead'
import { minimumReadMs, type FadeLedger } from '@/lantern/lineFade'

describe('useFadeOnceRead', () => {
  let root: HTMLElement
  let live: Readonly<Ref<number>>
  let ledger: FadeLedger
  let ids = 0
  let w: VueWrapper
  /** Whether the lines are held (the words hidden). */
  let held: Ref<boolean>

  /** A line as the stage draws it; `reading` marks it as being read aloud. */
  function line(
    opts: {
      reading?: boolean
      readMs?: number
      column?: HTMLElement
      text?: string
    } = {},
  ): HTMLElement {
    const el = document.createElement('p')
    if (opts.text) el.textContent = opts.text
    el.className = 'lq-line'
    el.dataset.lineId = `l${ids++}`
    if (opts.reading) el.classList.add('lq-speaking')
    if (opts.readMs !== undefined) el.dataset.readMs = String(opts.readMs)
    ;(opts.column ?? root).appendChild(el)
    return el
  }

  /** A column of its own on the stage, whose lines fade in their own order. */
  function column(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'lq-column'
    root.appendChild(el)
    return el
  }

  /** Let the observer see what changed. */
  const settle = (): Promise<void> =>
    new Promise((resolve) => queueMicrotask(resolve))

  /** The fade's CSS animation ends on `el`. */
  function fadeEnds(el: Element, name = 'lq-fade-away'): void {
    const event = new Event('animationend', { bubbles: true })
    Object.defineProperty(event, 'animationName', { value: name })
    el.dispatchEvent(event)
  }

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
    const container = ref<HTMLElement | null>(root)
    held = ref(false)
    const Host = defineComponent({
      setup() {
        const fading = useFadeOnceRead(
          container,
          '.lq-line',
          () => held.value,
          '.lq-column',
        )
        live = fading.live
        ledger = fading.ledger
        return () => h('i')
      },
    })
    w = mount(Host)
  })
  afterEach(() => {
    w.unmount()
    root.remove()
    vi.useRealTimers()
  })

  it('starts fading a line the moment it has been read', async () => {
    const el = line({ reading: true })
    await settle()
    expect(el.dataset.fade).toBe('live')
    el.classList.remove('lq-speaking')
    await settle()
    expect(el.dataset.fade).toBe('away')
  })

  it('fades a line whether or not more lines come after it', async () => {
    const first = line({ reading: true })
    await settle()
    first.classList.remove('lq-speaking')
    const second = line({ reading: true })
    await settle()
    expect(first.dataset.fade).toBe('away')
    expect(second.dataset.fade).toBe('live')
  })

  it('waits the time to read a line that is not read aloud', async () => {
    vi.useFakeTimers()
    const el = line({ readMs: 1200 })
    await vi.advanceTimersByTimeAsync(0)
    expect(el.dataset.fade).toBe('live')
    vi.advanceTimersByTime(1199)
    expect(el.dataset.fade).toBe('live')
    vi.advanceTimersByTime(1)
    expect(el.dataset.fade).toBe('away')
  })

  it('starts a line read aloud fading at once, however long its time to read', async () => {
    const el = line({ reading: true, readMs: 4000 })
    await settle()
    el.classList.remove('lq-speaking')
    await settle()
    expect(el.dataset.fade).toBe('away')
  })

  it('keeps a short line read aloud fully visible for its minimum reading time', async () => {
    vi.useFakeTimers()
    const text = "That's part of it. Not all. Keep looking."
    const el = line({ reading: true, readMs: 2000, text })
    await vi.advanceTimersByTimeAsync(1500)
    el.classList.remove('lq-speaking')
    await vi.advanceTimersByTimeAsync(0)
    expect(el.dataset.fade).toBe('live')
    await vi.advanceTimersByTimeAsync(minimumReadMs(text) - 1501)
    expect(el.dataset.fade).toBe('live')
    await vi.advanceTimersByTimeAsync(1)
    expect(el.dataset.fade).toBe('away')
  })

  it('starts a line fading the moment its narration ends when the narration outlasts its minimum reading time', async () => {
    vi.useFakeTimers()
    const text =
      'The corner by the altar is so dark that your eyes slide off it.'
    const el = line({ reading: true, text })
    await vi.advanceTimersByTimeAsync(minimumReadMs(text) + 500)
    el.classList.remove('lq-speaking')
    await vi.advanceTimersByTimeAsync(0)
    expect(el.dataset.fade).toBe('away')
  })

  it('keeps a short line never read aloud for its minimum reading time, past its own time to read', async () => {
    vi.useFakeTimers()
    const text = 'Keep looking.'
    const el = line({ readMs: 900, text })
    await vi.advanceTimersByTimeAsync(minimumReadMs(text) - 1)
    expect(el.dataset.fade).toBe('live')
    await vi.advanceTimersByTimeAsync(1)
    expect(el.dataset.fade).toBe('away')
  })

  it('gives a line never read aloud its time to read first, as after a skip', async () => {
    vi.useFakeTimers()
    const el = line({ readMs: 3000 })
    await vi.advanceTimersByTimeAsync(2999)
    expect(el.dataset.fade).toBe('live')
    await vi.advanceTimersByTimeAsync(1)
    expect(el.dataset.fade).toBe('away')
  })

  it('never fades a line while it is read aloud, though it waited its time to read before', async () => {
    vi.useFakeTimers()
    const el = line({ readMs: 1000 })
    await vi.advanceTimersByTimeAsync(500)
    el.classList.add('lq-speaking')
    await vi.advanceTimersByTimeAsync(1000)
    expect(el.dataset.fade).toBe('live')
    el.classList.remove('lq-speaking')
    await vi.advanceTimersByTimeAsync(0)
    expect(el.dataset.fade).toBe('away')
  })

  it('is gone once its fade has run, and the lines left are counted', async () => {
    const a = line()
    const b = line({ reading: true })
    await settle()
    expect(live.value).toBe(2)
    expect(a.dataset.fade).toBe('away')
    // Another animation ending (a line's own coming in) is not the fade.
    fadeEnds(a, 'lq-appear')
    expect(a.dataset.fade).toBe('away')
    fadeEnds(a)
    expect(a.dataset.fade).toBe('gone')
    expect(live.value).toBe(1)
    expect(b.dataset.fade).toBe('live')
  })

  it('counts the reduce-motion fade too', async () => {
    const a = line()
    await settle()
    fadeEnds(a, 'lq-fade-still')
    expect(a.dataset.fade).toBe('gone')
    expect(live.value).toBe(0)
  })

  it('holds every line while held, and lets go of each to be read anew', async () => {
    vi.useFakeTimers()
    const heardOne = line({ reading: true, readMs: 800 })
    const waitingOne = line({ readMs: 1200 })
    await vi.advanceTimersByTimeAsync(0)
    heardOne.classList.remove('lq-speaking')
    await vi.advanceTimersByTimeAsync(0)
    expect(heardOne.dataset.fade).toBe('away')
    held.value = true
    await vi.advanceTimersByTimeAsync(0)
    expect([heardOne.dataset.fade, waitingOne.dataset.fade]).toEqual([
      'live',
      'live',
    ])
    await vi.advanceTimersByTimeAsync(10_000)
    expect(waitingOne.dataset.fade).toBe('live')
    fadeEnds(heardOne)
    expect(live.value).toBe(2)

    held.value = false
    await vi.advanceTimersByTimeAsync(0)
    expect(heardOne.dataset.fade).toBe('live')
    await vi.advanceTimersByTimeAsync(800)
    expect([heardOne.dataset.fade, waitingOne.dataset.fade]).toEqual([
      'away',
      'live',
    ])
    await vi.advanceTimersByTimeAsync(400)
    expect(waitingOne.dataset.fade).toBe('away')
  })

  it('forgets a line taken off the stage', async () => {
    const a = line({ reading: true })
    await settle()
    expect(live.value).toBe(1)
    a.remove()
    await settle()
    expect(live.value).toBe(0)
  })

  it('never starts fading a line before the lines above it', async () => {
    vi.useFakeTimers()
    const older = line({ readMs: 3000 })
    const newer = line({ readMs: 500 })
    await vi.advanceTimersByTimeAsync(500)
    expect(newer.dataset.fade).toBe('live')
    await vi.advanceTimersByTimeAsync(2500)
    expect([older.dataset.fade, newer.dataset.fade]).toEqual(['away', 'away'])
  })

  it('starts a line heard while the line above still shows fading after it', async () => {
    vi.useFakeTimers()
    const older = line({ readMs: 3000 })
    const newer = line({ reading: true })
    await vi.advanceTimersByTimeAsync(0)
    newer.classList.remove('lq-speaking')
    await vi.advanceTimersByTimeAsync(0)
    expect(newer.dataset.fade).toBe('live')
    await vi.advanceTimersByTimeAsync(3000)
    expect([older.dataset.fade, newer.dataset.fade]).toEqual(['away', 'away'])
  })

  it('keeps a faded line in its place until every line above it is gone', async () => {
    const older = line()
    const newer = line()
    await settle()
    expect([older.dataset.fade, newer.dataset.fade]).toEqual(['away', 'away'])
    // The older one's fade was held (a pointer resting on it), so the newer ends first.
    fadeEnds(newer)
    expect(newer.dataset.fade).toBe('spent')
    expect(live.value).toBe(2)
    fadeEnds(older)
    expect([older.dataset.fade, newer.dataset.fade]).toEqual(['gone', 'gone'])
    expect(live.value).toBe(0)
  })

  it('orders the lines of each column on their own', async () => {
    vi.useFakeTimers()
    const narrator = column()
    const speech = column()
    const told = line({ readMs: 3000, column: narrator })
    const said = line({ readMs: 500, column: speech })
    await vi.advanceTimersByTimeAsync(500)
    expect([told.dataset.fade, said.dataset.fade]).toEqual(['live', 'away'])
    fadeEnds(said)
    expect(said.dataset.fade).toBe('gone')
  })

  it('keeps a line already faded away out of sight while the words are hidden', async () => {
    const older = line()
    const newer = line()
    await settle()
    fadeEnds(newer)
    held.value = true
    await settle()
    expect([older.dataset.fade, newer.dataset.fade]).toEqual(['live', 'spent'])
    held.value = false
    await settle()
    fadeEnds(older)
    expect([older.dataset.fade, newer.dataset.fade]).toEqual(['gone', 'gone'])
  })

  it('keeps each line’s state in the ledger, also one held back by the line above it', async () => {
    const older = line()
    const newer = line()
    await settle()
    const id = (el: HTMLElement): string => el.dataset.lineId ?? ''
    expect(ledger.states[id(newer)]).toBe('away')
    fadeEnds(newer)
    expect(ledger.states[id(newer)]).toBe('spent')
    expect(ledger.outOfSight(id(newer))).toBe(true)
    // The top line's fade has run with nothing above it: spent, then gone at once.
    fadeEnds(older)
    expect([ledger.states[id(older)], ledger.states[id(newer)]]).toEqual([
      'gone',
      'gone',
    ])
  })

  it('brings a line out of sight back into the ledger, read aloud again', async () => {
    const older = line()
    const newer = line()
    await settle()
    fadeEnds(newer)
    const before = ledger.version.value
    newer.classList.add('lq-speaking')
    await settle()
    expect(newer.dataset.fade).toBe('live')
    expect(ledger.outOfSight(newer.dataset.lineId ?? '')).toBe(false)
    expect(ledger.version.value).toBe(before + 1)
    expect(older.dataset.fade).toBe('away')
  })

  it('drops a line taken off the stage from the ledger', async () => {
    const a = line()
    await settle()
    const id = a.dataset.lineId ?? ''
    expect(id in ledger.states).toBe(true)
    a.remove()
    await settle()
    expect(id in ledger.states).toBe(false)
  })
})
