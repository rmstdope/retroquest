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
import { setPictureProbe } from '@/lantern/roomPicture'
import type { GameState } from '@/engine'
import { LightSpell } from '@/act1/spells/LightSpell'

/** Act I with Light already known, so a real spell sits on the belt. */
class Act1KnowingLight extends Act1 {
  /** Act I's own setup, then Light learnt. */
  override setupGameState(gameState: GameState): void {
    super.setupGameState(gameState)
    gameState.learnSpell(new LightSpell())
  }
}

/**
 * Dragging a picture of the belt onto what to use it with, over the real
 * engine in Elior's cottage: what lights, what the pill says, what a drop
 * sends and what every miss leaves untouched.
 */
describe('LanternLayout: dragging from the belt', () => {
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
  /** What `document.elementFromPoint` finds, per test. */
  let under: Node | null = null

  async function cottage(
    act: ActClass = Act1,
  ): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
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
    store.setBridge(useBridge(async (): Promise<ActClass[]> => [act]))
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
    const memory: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory[key] ?? null,
      setItem: (key: string, value: string) => {
        memory[key] = value
      },
      clear: () => undefined,
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  })
  afterEach(() => {
    w.unmount()
    setPictureProbe(null)
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const pointer = (
    type: string,
    x: number,
    y = 5,
    pointerType = 'mouse',
  ): PointerEvent =>
    new PointerEvent(type, {
      pointerType,
      clientX: x,
      clientY: y,
      button: 0,
      bubbles: true,
    })
  /** Press the bread's pocket and pull it far enough to lift. */
  async function lift(key = 'item:bread'): Promise<void> {
    const el = tile(key).element
    el.dispatchEvent(pointer('pointerdown', 10))
    el.dispatchEvent(pointer('pointermove', 30))
    await flushPromises()
  }
  const over = async (el: Node | null, x = 300, y = 200): Promise<void> => {
    under = el
    document.dispatchEvent(pointer('pointermove', x, y))
    await flushPromises()
  }
  const letGo = async (x = 300, y = 200): Promise<void> => {
    document.dispatchEvent(pointer('pointerup', x, y))
    await flushPromises()
  }
  const pill = (): string =>
    w.find('[data-drag-pill]').exists() ? w.get('[data-drag-pill]').text() : ''

  beforeEach(() => {
    under = null
    document.elementFromPoint = (): Element | null =>
      under instanceof Element ? under : null
  })

  it('lifts the picture: an empty ring in its pocket, a pill, faint marks, no strip', async () => {
    await cottage()
    await lift()
    expect(tile('item:bread').classes()).toContain('lq-belt-lifted')
    expect(pill()).toBe('Use Bread with…')
    expect(
      w
        .findAll('[data-drag-mark]')
        .map((m) => m.attributes('data-drag-mark'))
        .sort(),
    ).toEqual(expect.arrayContaining(['bread', 'grandmother']))
    expect(w.find('[data-drag-name]').exists()).toBe(false)
    expect(w.find('.lq-hand-text').exists()).toBe(false)
  })

  it('sends use … with … when dropped on a person, as if typed', async () => {
    const store = await cottage()
    await lift()
    await over(hit('grandmother').element)
    expect(pill()).toBe('Use Bread with Grandmother')
    expect(w.get('[data-drag-mark="grandmother"]').classes()).toContain(
      'lq-area-dropover',
    )
    expect(w.get('[data-drag-name="grandmother"]').text()).toBe('Grandmother')
    await letGo()
    expect(store.turns.at(-1)?.command).toBe('use bread with grandmother')
    expect(w.find('[data-drag-ghost]').exists()).toBe(false)
    expect(w.find('[data-drag-mark]').exists()).toBe(false)
    expect(tile('item:bread').classes()).not.toContain('lq-belt-lifted')
  })

  it('does not press the pocket when the drag is let go over it, or anywhere', async () => {
    const store = await cottage()
    await lift()
    await over(tile('item:bread').element)
    await letGo()
    const el = tile('item:bread').element
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await flushPromises()
    expect(ring().exists()).toBe(false)
    expect(store.turns.at(-1)?.command).not.toContain('use bread')
  })

  it('casts a spell on a thing of the picture, and a spell over the bag lights nothing', async () => {
    const store = await cottage(Act1KnowingLight)
    useBeltStore().show('spells')
    await flushPromises()
    await lift('spell:light')
    expect(pill()).toBe('Cast Light on…')
    await over(hit('bread').element)
    expect(pill()).toBe('Cast Light on Bread')
    await over(w.find('[data-belt-switch="bag"]').element)
    expect(pill()).toBe('Cast Light on…')
    await over(hit('bread').element)
    await letGo()
    expect(store.turns.at(-1)?.command).toBe('cast light on bread')
  })

  it('uses a thing with another thing of the bag, lighting that pocket', async () => {
    const store = await cottage()
    store.rawInventory = [
      ...store.rawInventory,
      { name: '[item_name]feather[/item_name]', description: 'Soft.' },
    ]
    store.bagEntries = [...store.bagEntries, 'feather']
    await flushPromises()
    await lift()
    await over(tile('item:feather').element)
    expect(pill()).toBe('Use Bread with Feather')
    expect(tile('item:feather').classes()).toContain('lq-belt-drop')
    await letGo()
    expect(store.turns.at(-1)?.command).toBe('use bread with feather')
  })

  it('glides back and sends nothing on a miss, an Escape or a lost pointer', async () => {
    const store = await cottage()
    const before = store.turns.length
    for (const end of ['letgo', 'escape', 'cancel'] as const) {
      await lift()
      await over(null)
      if (end === 'letgo') await letGo()
      else if (end === 'escape') await key('Escape')
      else {
        document.dispatchEvent(new Event('pointercancel'))
        await flushPromises()
      }
      expect(store.turns.length).toBe(before)
      expect(w.find('[data-drag-ghost]').exists()).toBe(true)
      expect(w.get('[data-drag-ghost]').classes()).toContain('lq-drag-glide')
      w.getComponent({ name: 'DragGhost' }).vm.$emit('done')
      await flushPromises()
      expect(w.find('[data-drag-ghost]').exists()).toBe(false)
      expect(tile('item:bread').classes()).not.toContain('lq-belt-lifted')
    }
  })

  it('is a miss over a way out', async () => {
    const store = await cottage()
    const before = store.turns.length
    await lift()
    const way = document.createElement('i')
    way.dataset.way = 'north'
    await over(way)
    expect(pill()).toBe('Use Bread with…')
    await letGo()
    expect(store.turns.length).toBe(before)
  })

  it('puts a thing in hand down when the drag takes over', async () => {
    await cottage()
    await click(tile('item:bread').element)
    await coin('usewith').trigger('click')
    await flushPromises()
    expect(strip()).toBe('Use Bread with…')
    await lift()
    expect(useBeltStore().hand).toBeNull()
    expect(w.find('.lq-hand-text').exists()).toBe(false)
    expect(pill()).toBe('Use Bread with…')
  })

  it('does not lift while the game takes no move', async () => {
    const store = await cottage()
    store.acceptInput = false
    await lift()
    expect(w.find('[data-drag-ghost]').exists()).toBe(false)
    expect(tile('item:bread').classes()).not.toContain('lq-belt-lifted')
  })

  it('still opens the wheel on a press that did not move', async () => {
    await cottage()
    await click(tile('item:bread').element)
    expect(ring().exists()).toBe(true)
  })
})
