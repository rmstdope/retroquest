// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AcquiredFlight from './AcquiredFlight.vue'
import {
  FLIGHT_HOLD_MS,
  FLIGHT_SHOW_MS,
  LEAVE_REST_MS,
  LEAVE_RISE_MS,
  useFlightStore,
} from '@/stores/useFlightStore'

/** A target button at (x, y) of the given kind, as the stage buttons carry them. */
function target(kind: string, x: number, y: number): HTMLElement {
  const button = document.createElement('button')
  button.dataset.flightTarget = kind
  button.getBoundingClientRect = (): DOMRect =>
    ({ left: x - 40, top: y - 20, width: 80, height: 40 }) as DOMRect
  document.body.appendChild(button)
  return button
}

describe('AcquiredFlight', () => {
  let w: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => {
    w?.unmount()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('shows nothing while nothing flies', () => {
    w = mount(AcquiredFlight)
    expect(w.find('[data-testid="flight"]').exists()).toBe(false)
  })

  it('shows the gained thing by its name, with its count and no plus sign', async () => {
    w = mount(AcquiredFlight)
    useFlightStore().launch([{ kind: 'item', name: 'bread', count: 2 }])
    await w.vm.$nextTick()
    const flight = w.get('[data-testid="flight"]')
    expect(flight.text()).toBe('Bread ×2')
    expect(flight.classes()).toContain('lq-flight-item')
  })

  it('flies to the button of its kind', async () => {
    target('item', 900, 100)
    target('spell', 1000, 100)
    w = mount(AcquiredFlight, { attachTo: document.body })
    useFlightStore().launch([{ kind: 'spell', name: 'revive', count: 1 }])
    await w.vm.$nextTick()
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS)
    await w.vm.$nextTick()
    const style = w.get('[data-testid="flight"]').attributes('style') ?? ''
    expect(style).toContain('left: 1000px')
    expect(style).toContain('top: 100px')
  })

  it('flies to the target that is shown, when there are two of a kind', async () => {
    const hidden = target('item', 50, 800)
    hidden.getBoundingClientRect = (): DOMRect =>
      ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect
    target('item', 117, 821)
    w = mount(AcquiredFlight, { attachTo: document.body })
    useFlightStore().launch([{ kind: 'item', name: 'key', count: 1 }])
    await w.vm.$nextTick()
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS)
    await w.vm.$nextTick()
    expect(w.get('[data-testid="flight"]').attributes('style')).toContain(
      'left: 117px',
    )
  })

  it('tells a screen reader of each gain, the same one again too', async () => {
    w = mount(AcquiredFlight)
    const flights = useFlightStore()
    const live = (): string => w!.get('[aria-live="polite"]').text()
    flights.launch([{ kind: 'item', name: 'coin', count: 1 }])
    await vi.advanceTimersByTimeAsync(50)
    expect(live()).toBe('Gained Coin')
    flights.clear()
    flights.launch([{ kind: 'item', name: 'coin', count: 1 }])
    await w.vm.$nextTick()
    expect(live()).toBe('')
    await vi.advanceTimersByTimeAsync(50)
    expect(live()).toBe('Gained Coin')
  })

  it('finds its button when it is drawn again in the middle of the flight', async () => {
    target('item', 900, 100)
    const flights = useFlightStore()
    flights.launch([{ kind: 'item', name: 'key', count: 1 }])
    vi.advanceTimersByTime(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS)
    expect(flights.phase).toBe('fly')
    w = mount(AcquiredFlight, { attachTo: document.body })
    await w.vm.$nextTick()
    expect(w.get('[data-testid="flight"]').attributes('style')).toContain(
      'left: 900px',
    )
  })

  it('does not tell earlier gains again when it is drawn anew', async () => {
    const flights = useFlightStore()
    flights.launch([{ kind: 'item', name: 'coin', count: 1 }])
    w = mount(AcquiredFlight)
    await vi.advanceTimersByTimeAsync(50)
    expect(w.get('[aria-live="polite"]').text()).toBe('')
  })

  describe('an item leaving the bag', () => {
    const bread = { kind: 'item' as const, name: 'bread', count: 1 }

    it('is grey with a minus sign before the bag, never the item green', async () => {
      w = mount(AcquiredFlight)
      useFlightStore().launch([], [bread])
      await w.vm.$nextTick()
      const flight = w.get('[data-testid="flight"]')
      expect(flight.text()).toBe('−Bread')
      expect(flight.classes()).toContain('lq-flight-lost')
      expect(flight.classes()).not.toContain('lq-flight-item')
    })

    it('starts at the Bag button and rises to the middle of the picture', async () => {
      target('item', 900, 700)
      const picture = document.createElement('div')
      picture.className = 'lq-stage-picture'
      picture.getBoundingClientRect = (): DOMRect =>
        ({ left: 100, top: 100, width: 400, height: 200 }) as DOMRect
      document.body.appendChild(picture)
      w = mount(AcquiredFlight, { attachTo: document.body })
      useFlightStore().launch([], [bread])
      await w.vm.$nextTick()
      const flight = w.get('[data-testid="flight"]')
      expect(flight.attributes('style')).toContain('left: 900px')
      expect(flight.attributes('style')).toContain('top: 700px')
      await vi.advanceTimersByTimeAsync(20)
      expect(flight.attributes('style')).toContain('left: 300px')
      expect(flight.attributes('style')).toContain('top: 200px')
      await vi.advanceTimersByTimeAsync(LEAVE_RISE_MS + LEAVE_REST_MS)
      expect(flight.attributes('style')).toContain('top: 230px')
      expect(flight.attributes('style')).toContain('opacity: 0')
    })

    it('starts in the middle of the picture when no Bag button is shown', async () => {
      const picture = document.createElement('div')
      picture.className = 'lq-stage-picture'
      picture.getBoundingClientRect = (): DOMRect =>
        ({ left: 100, top: 100, width: 400, height: 200 }) as DOMRect
      document.body.appendChild(picture)
      w = mount(AcquiredFlight, { attachTo: document.body })
      useFlightStore().launch([], [bread])
      await w.vm.$nextTick()
      const style = w.get('[data-testid="flight"]').attributes('style') ?? ''
      expect(style).toContain('left: 300px')
      expect(style).toContain('top: 200px')
    })

    it('is drawn on the picture when the stage comes back mid-flight', async () => {
      target('item', 900, 700)
      const picture = document.createElement('div')
      picture.className = 'lq-stage-picture'
      picture.getBoundingClientRect = (): DOMRect =>
        ({ left: 100, top: 100, width: 400, height: 200 }) as DOMRect
      document.body.appendChild(picture)
      useFlightStore().launch([], [bread])
      await vi.advanceTimersByTimeAsync(LEAVE_RISE_MS + 1)
      w = mount(AcquiredFlight, { attachTo: document.body })
      const style = w.get('[data-testid="flight"]').attributes('style') ?? ''
      expect(style).toContain('left: 300px')
      expect(style).toContain('top: 200px')
    })

    it('tells a screen reader what was lost before what was gained', async () => {
      w = mount(AcquiredFlight)
      useFlightStore().launch(
        [{ kind: 'item', name: 'hook', count: 1 }],
        [bread],
      )
      await vi.advanceTimersByTimeAsync(50)
      expect(w.get('[aria-live="polite"]').text()).toBe(
        'Lost Bread. Gained Hook',
      )
    })
  })
})
