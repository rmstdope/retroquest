// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import { arrivalBlocks } from '@/lantern/narrationScript'
import { SCENE_PAUSE_MS } from '@/lantern/narrationUnits'
import { startedHoldStore } from '@/testing/holdGame'

/** The recorded lines of the garden's arrival: its name, then its description. */
const GARDEN = arrivalBlocks('Garden', 'A green garden.')

/**
 * The side panels of a narrated move, over the real engine: the old place
 * stays until the voice reaches the arrival, and a press in a held panel, a
 * section tab, a verb or typing catches up.
 */
describe('LanternLayout: panels wait for the narration', () => {
  let wrapper: VueWrapper | undefined

  /** Mount the layout on a wide screen (or a phone) over the hold game. */
  async function ready(wide = true): Promise<VueWrapper> {
    vi.useFakeTimers()
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: wide && query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const manifest = Object.fromEntries(
      GARDEN.map(({ speaker, markup }) => [
        narrationKey(speaker, markup),
        {
          file: 'x.mp3',
          speaker,
          duration: 5,
          words: narrationWords(markup).map((word, i) => ({
            word,
            start: i,
            end: i + 1,
          })),
        },
      ]),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => manifest })),
    )
    useNarrationStore().setAudioFactory(
      (): NarrationAudio => ({
        volume: 1,
        currentTime: 0,
        onended: null,
        onerror: null,
        play: () => Promise.resolve(),
        pause: () => undefined,
      }),
    )
    const game = await startedHoldStore()
    game.actLabel = 'Act I'
    wrapper = mount(LanternLayout, { attachTo: document.body })
    await vi.advanceTimersByTimeAsync(0)
    return wrapper
  }

  /** Walk north and let the layout start the narration. */
  async function goNorth(): Promise<void> {
    useGameStore().submitCommand('go north')
    await vi.advanceTimersByTimeAsync(0)
  }

  const cardName = (w: VueWrapper): string => w.get('.lq-room-name').text()

  beforeEach(() => {
    setActivePinia(createPinia())
    try {
      localStorage.clear()
    } catch {
      // No storage in this environment.
    }
    useSettingsStore().narrationOn = true
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('keeps the old room card and map until the arrival is read, then lights them', async () => {
    const w = await ready()
    await goNorth()
    expect(useNarrationStore().isNarrating).toBe(true)
    expect(cardName(w)).toBe('Hall')
    expect(w.find('.lq-exit').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
    expect(cardName(w)).toBe('Garden')
    expect(w.get('.lq-room-card').classes()).toContain('lq-flash')
    expect(w.get('.lq-compass').classes()).toContain('lq-flash')
  })

  it('shows the new room at once when narration is off', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
    await goNorth()
    expect(cardName(w)).toBe('Garden')
    expect(useGameStore().panelsHeld).toBe(false)
  })

  it('catches up, and does nothing else, when a held map exit is pressed', async () => {
    const w = await ready()
    await goNorth()
    const turns = useGameStore().turns.length
    await w.get('.lq-compass .lq-exit').trigger('click')
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(cardName(w)).toBe('Garden')
    expect(useGameStore().turns).toHaveLength(turns)
    expect(w.get('.lq-room-card').classes()).not.toContain('lq-flash')
  })

  it('catches up when a verb is pressed, and the verb opens for the new place', async () => {
    const w = await ready()
    await goNorth()
    await w.get('[data-verb]').trigger('click')
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(cardName(w)).toBe('Garden')
  })

  it('catches up when typing starts in the command box', async () => {
    useSettingsStore().startMode = 'type'
    const w = await ready()
    await goNorth()
    expect(cardName(w)).toBe('Hall')
    await w.get('.lq-type-input').trigger('keydown', { key: 'x' })
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(cardName(w)).toBe('Garden')
  })

  it('catches up when another section is opened on a phone', async () => {
    const w = await ready(false)
    await goNorth()
    expect(useNarrationStore().isNarrating).toBe(true)
    const map = w
      .findAll('[role="tab"], button')
      .find((b) => b.text() === 'Map')
    await map!.trigger('click')
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(w.get('.lq-here-room').text()).toBe('Garden')
  })
})
