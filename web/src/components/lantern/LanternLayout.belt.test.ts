// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'
import { PANEL_GROUPS, useGameStore } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useBeltStore } from '@/stores/useBeltStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { setPictureProbe } from '@/lantern/roomPicture'

/**
 * The belt of pictures over the real engine, in Elior's cottage: the ring of a
 * carried thing, taking it in hand, what the next press sends, and what puts
 * it down again.
 */
describe('LanternLayout: the belt of pictures', () => {
  let w: VueWrapper
  const PLACED = {
    'act1-eliors-cottage': {
      width: 1920,
      height: 1080,
      areas: {
        bread: { x: 0.6, y: 0.6, width: 0.1, height: 0.1 },
        grandmother: { x: 0.8, y: 0.3, width: 0.1, height: 0.2 },
      },
    },
  }

  async function cottage(): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    useSettingsStore().alwaysShowNames = false
    setPictureProbe(() => Promise.resolve(true))
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(960)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(540)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 960,
      height: 540,
      right: 960,
      bottom: 540,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const store = useGameStore()
    store.setBridge(useBridge(async (): Promise<ActClass[]> => [Act1]))
    await store.initGame()
    store.dismissModal()
    store.showTitle = false
    store.setPanelHold(true)
    store.setScenePicture(true)
    store.submitCommand('talk to voice')
    store.submitCommand('take bread')
    store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], false)
    store.imageManifest = PLACED
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    // The turn's words are settled (a press while they are told only hurries them).
    useNarrationStore().skipAll()
    useStageSpeechStore().revealAll()
    await flushPromises()
    return store
  }

  const tile = (key: string): ReturnType<VueWrapper['find']> =>
    w.find(`[data-belt-pic="${key}"]`)
  const hit = (id: string): ReturnType<VueWrapper['find']> =>
    w.find(`[data-area-press="${id}"]`)
  const ring = (): ReturnType<VueWrapper['find']> => w.find('.lq-press-ring')
  const coin = (id: string): ReturnType<VueWrapper['find']> =>
    w.find(`.lq-press-ring [data-ring-action="${id}"]`)
  const click = async (
    el: EventTarget,
    at: { x: number; y: number } = { x: 400, y: 300 },
  ): Promise<void> => {
    el.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        detail: 1,
        clientX: at.x,
        clientY: at.y,
      }),
    )
    await flushPromises()
  }
  const key = async (k: string): Promise<void> => {
    ;(document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
    )
    await flushPromises()
  }
  const strip = (): string =>
    w.find('.lq-hand-text').exists() ? w.get('.lq-hand-text').text() : ''

  beforeEach(() => {
    localStorage?.clear?.()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  })
  afterEach(() => {
    w.unmount()
    setPictureProbe(null)
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows what is carried as pictures on the belt, and no Bag or Spells button at the top', async () => {
    await cottage()
    expect(tile('item:bread').exists()).toBe(true)
    expect(w.find('.lq-stage-buttons [data-button="bag"]').exists()).toBe(false)
    expect(w.find('[data-belt-switch="bag"]').attributes('aria-pressed')).toBe(
      'true',
    )
  })

  it('opens the ring of a carried thing: Use, Use with…, Give…, Open, Close, Examine', async () => {
    await cottage()
    await click(tile('item:bread').element)
    expect(w.get('.lq-ring-name').text()).toBe('Bread')
    expect(
      w
        .findAll('.lq-press-ring .lq-ring-coin')
        .map((c) => c.attributes('data-ring-action')),
    ).toEqual(['use', 'usewith', 'give', 'open', 'close', 'examine'])
    expect(w.get('.lq-belt-caption').text()).toContain('Bread')
  })

  it('sends Use at once, as if typed, and puts focus back on the picture', async () => {
    const store = await cottage()
    await click(tile('item:bread').element)
    await coin('use').trigger('click')
    await flushPromises()
    expect(ring().exists()).toBe(false)
    expect(store.turns.at(-1)?.command).toBe('use bread')
  })

  it('takes the thing in hand for Use with…, sending nothing, and the next press on a thing decides', async () => {
    const store = await cottage()
    const before = store.turns.length
    await click(tile('item:bread').element)
    await coin('usewith').trigger('click')
    await flushPromises()
    expect(ring().exists()).toBe(false)
    expect(strip()).toBe('Use Bread with…')
    expect(tile('item:bread').classes()).toContain('lq-lit')
    expect(store.turns.length).toBe(before)
    expect(useBeltStore().hand?.verb).toBe('usewith')

    await click(hit('grandmother').element)
    expect(store.turns.at(-1)?.command).toBe('use bread with grandmother')
    expect(useBeltStore().hand).toBeNull()
    expect(strip()).toBe('')
  })

  it('gives to a person with Give…', async () => {
    const store = await cottage()
    await click(tile('item:bread').element)
    await coin('give').trigger('click')
    await flushPromises()
    expect(strip()).toBe('Give Bread to…')
    await click(hit('grandmother').element)
    expect(store.turns.at(-1)?.command).toBe('give bread to grandmother')
  })

  it('moves focus to the first thing in the room when something is taken in hand', async () => {
    await cottage()
    await click(tile('item:bread').element)
    await coin('usewith').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(hit('grandmother').element)
  })

  it('puts the hand down with ✕ Cancel, sending nothing, focus back on the picture', async () => {
    const store = await cottage()
    const before = store.turns.length
    await click(tile('item:bread').element)
    await coin('give').trigger('click')
    await flushPromises()
    await w.get('[data-hand-cancel]').trigger('click')
    await flushPromises()
    expect(useBeltStore().hand).toBeNull()
    expect(store.turns.length).toBe(before)
    expect(document.activeElement).toBe(tile('item:bread').element)
  })

  it('puts the hand down with Escape', async () => {
    await cottage()
    await click(tile('item:bread').element)
    await coin('give').trigger('click')
    await flushPromises()
    await key('Escape')
    expect(useBeltStore().hand).toBeNull()
    expect(document.activeElement).toBe(tile('item:bread').element)
  })

  it('puts the hand down when any other command is sent', async () => {
    const store = await cottage()
    await click(tile('item:bread').element)
    await coin('give').trigger('click')
    await flushPromises()
    store.submitCommand('look')
    await flushPromises()
    expect(useBeltStore().hand).toBeNull()
  })

  it('puts the hand down when what is in hand is lost', async () => {
    const store = await cottage()
    await click(tile('item:bread').element)
    await coin('give').trigger('click')
    await flushPromises()
    store.rawInventory = []
    store.bagEntries = []
    await flushPromises()
    expect(useBeltStore().hand).toBeNull()
  })

  it('keeps the thing in hand when the picture in hand itself is pressed', async () => {
    const store = await cottage()
    const before = store.turns.length
    await click(tile('item:bread').element)
    await coin('give').trigger('click')
    await flushPromises()
    await click(tile('item:bread').element)
    expect(useBeltStore().hand).not.toBeNull()
    expect(store.turns.length).toBe(before)
    expect(ring().exists()).toBe(false)
  })

  it('opens no ring while the game takes no move', async () => {
    const store = await cottage()
    store.acceptInput = false
    await click(tile('item:bread').element)
    expect(ring().exists()).toBe(false)
  })

  it('goes to the belt with B, switches lists with B again, and Escape goes back', async () => {
    await cottage()
    const before = hit('grandmother').element as HTMLElement
    before.focus()
    await key('b')
    expect(document.activeElement).toBe(tile('item:bread').element)
    await key('b')
    expect(useBeltStore().list).toBe('spells')
    await key('b')
    expect(useBeltStore().list).toBe('bag')
    await key('Escape')
    expect(document.activeElement).toBe(before)
  })

  it('brings the belt back with B when it was put away', async () => {
    await cottage()
    await w.get('[data-belt-away]').trigger('click')
    expect(tile('item:bread').exists()).toBe(false)
    ;(hit('grandmother').element as HTMLElement).focus()
    await key('b')
    expect(useBeltStore().away).toBe(false)
    expect(document.activeElement).toBe(tile('item:bread').element)
  })

  it('opens the ring from the keyboard with Enter on a picture, focus on the first action', async () => {
    await cottage()
    ;(tile('item:bread').element as HTMLElement).focus()
    await click(tile('item:bread').element, { x: 0, y: 0 })
    expect(document.activeElement).toBe(coin('use').element)
  })

  it('does nothing for B while typing in a text box', async () => {
    await cottage()
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    await key('b')
    expect(document.activeElement).toBe(input)
  })

  it('closes the ring when its picture leaves the belt', async () => {
    const store = await cottage()
    await click(tile('item:bread').element)
    store.rawInventory = []
    store.bagEntries = []
    await flushPromises()
    expect(ring().exists()).toBe(false)
  })
})
