// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, type Ref } from 'vue'
import { useFadeOnceRead } from './useFadeOnceRead'

describe('useFadeOnceRead', () => {
  let root: HTMLElement
  let live: Readonly<Ref<number>>
  let w: VueWrapper

  /** A line as the stage draws it; `reading` marks it as being read aloud. */
  function line(
    opts: { reading?: boolean; readMs?: number } = {},
  ): HTMLElement {
    const el = document.createElement('p')
    el.className = 'lq-line'
    if (opts.reading) el.classList.add('lq-speaking')
    if (opts.readMs !== undefined) el.dataset.readMs = String(opts.readMs)
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
    const Host = defineComponent({
      setup() {
        live = useFadeOnceRead(container, '.lq-line').live
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

  it('gives a line never read aloud its time to read first, as after a skip', async () => {
    vi.useFakeTimers()
    const el = line({ readMs: 3000 })
    await vi.advanceTimersByTimeAsync(2999)
    expect(el.dataset.fade).toBe('live')
    await vi.advanceTimersByTimeAsync(1)
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

  it('forgets a line taken off the stage', async () => {
    const a = line({ reading: true })
    await settle()
    expect(live.value).toBe(1)
    a.remove()
    await settle()
    expect(live.value).toBe(0)
  })
})
