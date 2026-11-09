// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useFlightStore } from '@/stores/useFlightStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import { arrivalBlocks } from '@/lantern/narrationScript'
import { SCENE_PAUSE_MS } from '@/lantern/narrationUnits'
import { ARRIVAL_CLEAR_AFTER_MS } from '@/lantern/stageArrival'
import { GEM, startedHoldStore } from '@/testing/holdGame'

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
    vi.restoreAllMocks()
  })

  it('flies a gained item to the Bag only once the narrator lets go of the bag', async () => {
    // The quest the gem starts chimes, which jsdom cannot play.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    await ready()
    const narration = useNarrationStore()
    const clip = { file: 'x.mp3', speaker: 'narrator', duration: 5, words: [] }
    vi.spyOn(narration, 'manifestFor').mockReturnValue(
      new Proxy({}, { get: () => clip }),
    )
    useGameStore().submitCommand(`take ${GEM.toLowerCase()}`)
    await vi.advanceTimersByTimeAsync(0)
    expect(narration.isNarrating).toBe(true)
    expect(useFlightStore().current).toBeNull()
    narration.skipAll()
    await vi.advanceTimersByTimeAsync(0)
    // The gem starts a quest: the flight waits for its news in the middle.
    expect(useFlightStore().current).toBeNull()
    useArrivalStore().clear()
    await vi.advanceTimersByTimeAsync(0)
    expect(useFlightStore().current?.name).toBe(GEM)
  })

  it('keeps the old plate and map until the arrival is read, then lights them', async () => {
    const w = await ready()
    await w.get('[data-button="map"]').trigger('click')
    await goNorth()
    expect(useNarrationStore().isNarrating).toBe(true)
    expect(cardName(w)).toBe('Hall')
    expect(w.find('.lq-exit').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
    expect(cardName(w)).toBe('Garden')
    expect(w.get('.lq-plate').classes()).toContain('lq-flash')
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
    await w.get('[data-button="map"]').trigger('click')
    await goNorth()
    const turns = useGameStore().turns.length
    await w.get('.lq-compass .lq-exit').trigger('click')
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(cardName(w)).toBe('Garden')
    expect(useGameStore().turns).toHaveLength(turns)
    expect(w.get('.lq-plate').classes()).not.toContain('lq-flash')
  })

  it('opens the bigger map on the first press while the voice reads on', async () => {
    const w = await ready()
    await w.get('[data-button="map"]').trigger('click')
    await goNorth()
    await w.get('[data-bigger-map]').trigger('click')
    expect(document.querySelector('.lq-dialog-layer')).not.toBeNull()
    expect(useNarrationStore().isNarrating).toBe(true)
    // The window shows the place the voice is still reading from, dimmed.
    const places = [
      ...document.querySelectorAll<HTMLButtonElement>('button.lq-place'),
    ]
    expect(places.length).toBeGreaterThan(0)
    expect(places.every((p) => p.disabled)).toBe(true)
    expect(
      document.querySelector('[data-current="true"]')?.textContent,
    ).toContain('Hall')
    // Once the arrival is read the map catches up.
    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
    expect(
      document.querySelector('[data-current="true"]')?.textContent,
    ).toContain('Garden')
    expect(useGameStore().groupHeld('place')).toBe(false)
  })

  it('opens Story so far on the first press while the voice reads on', async () => {
    const w = await ready()
    await goNorth()
    await w.get('[data-button="story"]').trigger('click')
    expect(w.find('.lq-story-drawer').exists()).toBe(true)
    expect(useNarrationStore().isNarrating).toBe(true)
    expect(cardName(w)).toBe('Hall')
  })

  it.each(['quests'])(
    'opens the %s drawer on the first press while the voice reads on',
    async (tab) => {
      const w = await ready()
      await goNorth()
      await w.get(`[data-button="${tab}"]`).trigger('click')
      expect(w.find('.lq-drawer').exists()).toBe(true)
      expect(useNarrationStore().isNarrating).toBe(true)
    },
  )

  it.each([
    ['the action row', true, false, '.lq-composer button.lq-hint'],
    ['the open phone sheet', false, true, '.lq-composer button.lq-hint'],
    ['the folded phone bar', false, false, 'button.lq-dock-hint'],
  ])(
    'offers Hint on %s during an arrival, and a press cuts it short with one hint',
    async (_surface, wide, openSheet, selector) => {
      const w = await ready(wide)
      const game = useGameStore()
      await goNorth()
      if (openSheet) await w.get('button.lq-dock-open').trigger('click')
      expect(useArrivalStore().active).toBe(true)
      expect(useNarrationStore().isNarrating).toBe(true)
      const hint = w.get(selector)
      expect(hint.attributes('aria-disabled')).toBe('false')
      expect(hint.classes()).not.toContain('lq-busy')
      const turns = game.turns.length
      await hint.trigger('click')
      expect(useArrivalStore().active).toBe(false)
      expect(useNarrationStore().isNarrating).toBe(false)
      expect(game.turns).toHaveLength(turns + 1)
      expect(game.turns.at(-1)?.command).toBe('hint')
    },
  )

  it('opens the map on the first press while the voice reads on', async () => {
    const w = await ready()
    await goNorth()
    await w.get('[data-button="map"]').trigger('click')
    expect(w.find('.lq-map-pop').exists()).toBe(true)
    expect(useNarrationStore().isNarrating).toBe(true)
  })

  it('clears the arrival on the picture, and the voice, when a verb is pressed', async () => {
    const w = await ready()
    await goNorth()
    expect(useNarrationStore().isNarrating).toBe(true)
    await w.get('[data-verb="take"]').trigger('click')
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(cardName(w)).toBe('Garden')
  })

  it('cuts in when a verb that needs nothing more is pressed', async () => {
    const w = await ready()
    await goNorth()
    await w.get('[data-verb="look"]').trigger('click')
    // The look is the newest turn; no command is echoed on the left.
    expect(useGameStore().turns.at(-1)?.command).toBe('look')
    expect(w.find('[data-testid="command"]').exists()).toBe(false)
    expect(cardName(w)).toBe('Garden')
  })

  it('keeps the voice reading while typing, and the word list follows the place', async () => {
    useSettingsStore().startMode = 'type'
    const w = await ready()
    const game = useGameStore()
    await goNorth()
    expect(cardName(w)).toBe('Hall')
    await w.get('.lq-type-input').trigger('keydown', { key: 'x' })
    expect(useNarrationStore().isNarrating).toBe(true)
    expect(cardName(w)).toBe('Hall')
    const before = JSON.stringify(game.completionTree)
    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
    expect(cardName(w)).toBe('Garden')
    expect(JSON.stringify(game.completionTree)).not.toBe(before)
  })

  it('holds the word list at the old place until the arrival is read', async () => {
    const w = await ready()
    const game = useGameStore()
    const before = JSON.stringify(game.completionTree)
    await goNorth()
    expect(cardName(w)).toBe('Hall')
    expect(JSON.stringify(game.completionTree)).toBe(before)
  })

  it('keeps the voice reading when another section is opened on a phone', async () => {
    const w = await ready(false)
    await goNorth()
    expect(useNarrationStore().isNarrating).toBe(true)
    const map = w
      .findAll('[role="tab"], button')
      .find((b) => b.text() === 'Map')
    await map!.trigger('click')
    expect(useNarrationStore().isNarrating).toBe(true)
    expect(w.get('.lq-here-room').text()).toBe('Hall')
    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
    expect(w.get('.lq-here-room').text()).toBe('Garden')
  })

  it('takes the arrival along when the layout goes, so no store acts later', async () => {
    const w = await ready()
    await goNorth()
    expect(useArrivalStore().active).toBe(true)
    w.unmount()
    wrapper = undefined
    // The next test's pinia: a late action of this test's stores would replace it.
    const next = createPinia()
    setActivePinia(next)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(ARRIVAL_CLEAR_AFTER_MS)
    expect(getActivePinia() === next).toBe(true)
  })

  it('still narrates a command run from the phone Map section', async () => {
    const w = await ready(false)
    const map = w
      .findAll('[role="tab"], button')
      .find((b) => b.text() === 'Map')
    await map!.trigger('click')
    await w.get('.lq-compass .lq-exit').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(useNarrationStore().isNarrating).toBe(true)
  })
})
