// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { GEM, startedHoldStore } from '@/testing/holdGame'
import { useGameStore } from '@/stores/useGameStore'
import { useBeltStore } from '@/stores/useBeltStore'

/** A laptop: a wide window with a mouse and keyboard. */
function laptop(): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('min-width') || query.includes('pointer: fine'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

/** Typed `map` and `inventory` open the screens that already show them. */
describe('LanternLayout: the typed map and inventory', () => {
  let w: VueWrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    // jsdom plays no sound: its play() answers nothing.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    setActivePinia(createPinia())
    laptop()
    await startedHoldStore()
    useGameStore().showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    await flushPromises()
  })
  afterEach(() => {
    w.unmount()
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const heading = (): string | undefined =>
    document.querySelector('[role="dialog"] h2')?.textContent?.trim()
  const turns = (): number => useGameStore().turns.length

  it('map opens the drawn map, writes no turn, and closing gives focus back to the typing box', async () => {
    const before = turns()
    useGameStore().submitCommand('map')
    await flushPromises()
    expect(heading()).toBe('Map')
    expect(turns()).toBe(before)
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
    await flushPromises()
    expect(heading()).toBeUndefined()
    expect(document.activeElement?.classList.contains('lq-type-input')).toBe(
      true,
    )
  })

  it('inventory with things in the bag brings a put-away strap up, switched to the bag, and lights it for a second', async () => {
    const game = useGameStore()
    game.submitCommand(`take ${GEM}`)
    // Let the gem fly into the bag and the telling end.
    await vi.advanceTimersByTimeAsync(20000)
    await flushPromises()
    const belt = useBeltStore()
    belt.putAway()
    belt.show('spells')
    const before = turns()
    game.submitCommand('inventory')
    await flushPromises()
    expect(belt.away).toBe(false)
    expect(belt.list).toBe('bag')
    expect(belt.lit).toBe(true)
    expect(turns()).toBe(before)
    expect(document.activeElement?.classList.contains('lq-type-input')).toBe(
      true,
    )
    vi.advanceTimersByTime(1000)
    expect(belt.lit).toBe(false)
  })

  it('inventory with an empty bag lights nothing and says so in one turn', async () => {
    const game = useGameStore()
    const before = turns()
    game.submitCommand('inventory')
    await flushPromises()
    expect(useBeltStore().lit).toBe(false)
    expect(turns()).toBe(before + 1)
    expect(game.turns.at(-1)?.text).toBe('Your bag is empty.')
  })
})
