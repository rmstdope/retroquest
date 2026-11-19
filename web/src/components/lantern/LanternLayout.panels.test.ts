// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import {
  FLIGHT_FLY_MS,
  FLIGHT_HOLD_MS,
  FLIGHT_SHOW_MS,
  useFlightStore,
} from '@/stores/useFlightStore'
import { useBeltStore } from '@/stores/useBeltStore'
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
    useNarrationStore().setAudioFactory((): NarrationAudio => ({
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
      play: () => Promise.resolve(),
      pause: () => undefined,
    }))
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

  const cardName = (w: VueWrapper): string => w.get('.lq-name-text').text()

  beforeEach(() => {
    setActivePinia(createPinia())
    try {
      localStorage.clear()
    } catch {
      // No storage in this environment.
    }
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

  it('keeps a gained thing out of the Bag from the moment the narrator lets go of it until it lands', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    await ready()
    const narration = useNarrationStore()
    const flights = useFlightStore()
    const clip = { file: 'x.mp3', speaker: 'narrator', duration: 5, words: [] }
    vi.spyOn(narration, 'manifestFor').mockReturnValue(
      new Proxy({}, { get: () => clip }),
    )
    useGameStore().submitCommand(`take ${GEM.toLowerCase()}`)
    await vi.advanceTimersByTimeAsync(0)
    expect(flights.owing('item', GEM)).toBe(0)
    narration.skipAll()
    await vi.advanceTimersByTimeAsync(0)
    // The bag is let go of, the flight still waits for the news: nothing shows yet.
    expect(flights.current).toBeNull()
    expect(flights.owing('item', GEM)).toBe(1)
    // The list does not show it yet (the stock is released, the thing is held back).
    expect(wrapper!.find(`[data-belt-pic="item:${GEM}"]`).exists()).toBe(false)
    useArrivalStore().clear()
    await vi.advanceTimersByTimeAsync(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS)
    expect(flights.owing('item', GEM)).toBe(1)
    expect(wrapper!.find(`[data-belt-pic="item:${GEM}"]`).exists()).toBe(false)
    await vi.advanceTimersByTimeAsync(FLIGHT_FLY_MS)
    expect(flights.owing('item', GEM)).toBe(0)
    expect(wrapper!.find(`[data-belt-pic="item:${GEM}"]`).exists()).toBe(true)
  })

  it('shows a gained thing in the Bag at once when a new command cuts its flight short', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    await ready()
    const narration = useNarrationStore()
    const flights = useFlightStore()
    const clip = { file: 'x.mp3', speaker: 'narrator', duration: 5, words: [] }
    vi.spyOn(narration, 'manifestFor').mockReturnValue(
      new Proxy({}, { get: () => clip }),
    )
    useGameStore().submitCommand(`take ${GEM.toLowerCase()}`)
    await vi.advanceTimersByTimeAsync(0)
    narration.skipAll()
    await vi.advanceTimersByTimeAsync(0)
    expect(flights.owing('item', GEM)).toBe(1)
    flights.clear()
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper!.find(`[data-belt-pic="item:${GEM}"]`).exists()).toBe(true)
  })

  it('switches a hidden rail on the Spells side to the Bag as a gained item starts to fly, and leaves it there (rq-jbu4)', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    await ready()
    const narration = useNarrationStore()
    const belt = useBeltStore()
    const clip = { file: 'x.mp3', speaker: 'narrator', duration: 5, words: [] }
    vi.spyOn(narration, 'manifestFor').mockReturnValue(
      new Proxy({}, { get: () => clip }),
    )
    belt.show('spells')
    belt.putAway()
    useGameStore().submitCommand(`take ${GEM.toLowerCase()}`)
    await vi.advanceTimersByTimeAsync(0)
    narration.skipAll()
    await vi.advanceTimersByTimeAsync(0)
    // Nothing flies yet: the rail is as the player left it.
    expect(belt.list).toBe('spells')
    expect(belt.away).toBe(true)
    useArrivalStore().clear()
    await vi.advanceTimersByTimeAsync(0)
    expect(useFlightStore().current?.name).toBe(GEM)
    expect(belt.list).toBe('bag')
    expect(belt.away).toBe(false)
    await vi.advanceTimersByTimeAsync(
      FLIGHT_SHOW_MS + FLIGHT_HOLD_MS + FLIGHT_FLY_MS,
    )
    expect(belt.list).toBe('bag')
    expect(belt.away).toBe(false)
  })

  it('keeps a taken thing painted until the narrator is done, then lets it go as its name comes up (rq-sm83)', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    await ready()
    const narration = useNarrationStore()
    const game = useGameStore()
    const clip = { file: 'x.mp3', speaker: 'narrator', duration: 5, words: [] }
    vi.spyOn(narration, 'manifestFor').mockReturnValue(
      new Proxy({}, { get: () => clip }),
    )
    game.submitCommand(`take ${GEM.toLowerCase()}`)
    await vi.advanceTimersByTimeAsync(0)
    const gem = game.turns.at(-1)!.gained[0]
    expect(gem.areaId).toBe('chiming-gem')
    expect(game.heldGains).toEqual(['chiming-gem'])
    narration.skipAll()
    useArrivalStore().clear()
    await vi.advanceTimersByTimeAsync(0)
    // Its name has come up, and the thing has left the picture in the same moment.
    expect(useFlightStore().current?.name).toBe(GEM)
    expect(game.heldGains).toEqual([])
  })

  it('cuts the narration short, flies the gain, and only then runs a command typed meanwhile (rq-sm83)', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    await ready()
    const narration = useNarrationStore()
    const game = useGameStore()
    const clip = { file: 'x.mp3', speaker: 'narrator', duration: 5, words: [] }
    vi.spyOn(narration, 'manifestFor').mockReturnValue(
      new Proxy({}, { get: () => clip }),
    )
    game.submitCommand(`take ${GEM.toLowerCase()}`)
    await vi.advanceTimersByTimeAsync(0)
    expect(narration.isNarrating).toBe(true)
    const turns = game.turns.length
    game.submitCommand('go north')
    expect(game.turns).toHaveLength(turns)
    await vi.advanceTimersByTimeAsync(0)
    expect(narration.isNarrating).toBe(false)
    useArrivalStore().clear()
    await vi.advanceTimersByTimeAsync(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS)
    expect(game.turns).toHaveLength(turns)
    await vi.advanceTimersByTimeAsync(FLIGHT_FLY_MS)
    expect(game.turns).toHaveLength(turns + 1)
    expect(game.turns.at(-1)!.command).toBe('go north')
  })

  it('also waits for the flight of a gain with no spot in the picture, such as a given item or a spell (rq-sm83)', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    await ready()
    const narration = useNarrationStore()
    const game = useGameStore()
    const clip = { file: 'x.mp3', speaker: 'narrator', duration: 5, words: [] }
    vi.spyOn(narration, 'manifestFor').mockReturnValue(
      new Proxy({}, { get: () => clip }),
    )
    game.submitCommand(`take ${GEM.toLowerCase()}`)
    await vi.advanceTimersByTimeAsync(0)
    // Stand in for a gain that never lay in the picture.
    game.releaseGain('chiming-gem')
    const turns = game.turns.length
    game.submitCommand('look')
    expect(game.turns).toHaveLength(turns)
    await vi.advanceTimersByTimeAsync(0)
    useArrivalStore().clear()
    await vi.advanceTimersByTimeAsync(FLIGHT_SHOW_MS + FLIGHT_HOLD_MS)
    expect(useFlightStore().current?.name).toBe(GEM)
    expect(game.turns).toHaveLength(turns)
    await vi.advanceTimersByTimeAsync(FLIGHT_FLY_MS)
    expect(game.turns).toHaveLength(turns + 1)
  })

  /** A key pressed on the page. */
  async function key(name: string): Promise<void> {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: name,
        bubbles: true,
        cancelable: true,
      }),
    )
    await vi.advanceTimersByTimeAsync(0)
  }

  it('holds the old room until the arrival is told, also at narration volume 0', async () => {
    const w = await ready()
    useSettingsStore().narrationVolume = 0
    await goNorth()
    expect(useNarrationStore().isNarrating).toBe(true)
    expect(cardName(w)).toBe('Hall')
    expect(useGameStore().panelsHeld).toBe(true)
  })

  it('keeps the old plate until the arrival is read, then lights it', async () => {
    const w = await ready()
    await goNorth()
    expect(useNarrationStore().isNarrating).toBe(true)
    expect(cardName(w)).toBe('Hall')

    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
    expect(cardName(w)).toBe('Garden')
    expect(w.get('.lq-plate').classes()).toContain('lq-flash')
  })

  it('opens the bigger map on the first M while the voice reads on', async () => {
    await ready()
    useGameStore().showTitle = false
    await goNorth()
    await key('m')
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
    // M is not the menu: the voice reads on under the map, and once the arrival is read the map catches up.
    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
    expect(
      document.querySelector('[data-current="true"]')?.textContent,
    ).toContain('Garden')
    expect(useGameStore().groupHeld('place')).toBe(false)
  })

  it('opens the Journal on the first J while the voice reads on', async () => {
    const w = await ready()
    useGameStore().showTitle = false
    await goNorth()
    await key('j')
    expect(w.find('.lq-story-drawer').exists()).toBe(true)
    expect(useNarrationStore().isNarrating).toBe(true)
    expect(cardName(w)).toBe('Hall')
  })

  it('opens the Quests drawer on the first Q while the voice reads on', async () => {
    const w = await ready()
    useGameStore().showTitle = false
    await goNorth()
    await key('q')
    expect(w.find('.lq-drawer').exists()).toBe(true)
    expect(useNarrationStore().isNarrating).toBe(true)
  })

  it.each([
    ['on the laptop', true],
    ['on the phone plate', false],
  ])(
    'offers Hint in the room menu %s, and a press asks for one hint',
    async (_surface, wide) => {
      // (While an arrival is told the room's name is inert in a browser, so Hint waits for it to be read.)
      const w = await ready(wide)
      const game = useGameStore()
      await w.get('.lq-name-btn').trigger('click')
      const hint = w.findAll('.lq-pill').at(-1)!
      expect(hint.text()).toBe('💡 Hint')
      expect(hint.attributes('aria-disabled')).toBe('false')
      expect(hint.classes()).not.toContain('lq-busy')
      const turns = game.turns.length
      await hint.trigger('click')
      expect(game.turns).toHaveLength(turns + 1)
      expect(game.turns.at(-1)?.command).toBe('hint')
    },
  )

  it('clears the arrival on the picture, and the voice, when a pill is pressed', async () => {
    const w = await ready()
    await goNorth()
    expect(useNarrationStore().isNarrating).toBe(true)
    await w.get('.lq-name-btn').trigger('click')
    await w.findAll('.lq-pill')[1].trigger('click')
    expect(useGameStore().turns.at(-1)?.command).toBe('search')
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(cardName(w)).toBe('Garden')
  })

  it('cuts in when Look is pressed', async () => {
    const w = await ready()
    await goNorth()
    await w.get('.lq-name-btn').trigger('click')
    await w.get('.lq-pill').trigger('click')
    // The look is the newest turn; no command is echoed on the left.
    expect(useGameStore().turns.at(-1)?.command).toBe('look')
    expect(w.find('[data-testid="command"]').exists()).toBe(false)
    expect(cardName(w)).toBe('Garden')
  })

  it('keeps the voice reading while typing, and the word list follows the place', async () => {
    const w = await ready()
    const game = useGameStore()
    useGameStore().showModal = false
    useGameStore().showTitle = false
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
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
