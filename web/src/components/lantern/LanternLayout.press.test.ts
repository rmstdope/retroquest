// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'
import { PANEL_GROUPS, useGameStore } from '@/stores/useGameStore'
import { useAreaNamesStore } from '@/stores/useAreaNamesStore'
import {
  useStageSpeechStore,
  type StageLine,
} from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { setPictureProbe } from '@/lantern/roomPicture'

/**
 * Pressing a thing on the picture of Elior's cottage over the real engine:
 * the ring, what it sends, and when it opens, closes and gives focus back.
 */
describe('LanternLayout: pressing a thing on the picture', () => {
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

  const hit = (id: string): ReturnType<VueWrapper['find']> =>
    w.find(`[data-area-press="${id}"]`)
  const ring = (): ReturnType<VueWrapper['find']> => w.find('.lq-press-ring')
  const coin = (id: string): ReturnType<VueWrapper['find']> =>
    w.find(`.lq-press-ring [data-ring-action="${id}"]`)
  const press = async (id: string): Promise<void> => {
    hit(id).element.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        detail: 1,
        clientX: 400,
        clientY: 300,
      }),
    )
    await flushPromises()
  }
  const key = async (k: string): Promise<void> => {
    ;(document.activeElement ?? document).dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }),
    )
    await w.vm.$nextTick()
  }

  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  })
  afterEach(() => {
    w.unmount()
    setPictureProbe(null)
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('opens a ring for a thing, with its name, as the Actions row would offer it', async () => {
    await cottage()
    useAreaNamesStore().pointer = { x: 620, y: 350 }
    await flushPromises()
    expect(w.find('[data-area-pointer]').text()).toBe('Bread')
    await press('bread')
    expect(ring().exists()).toBe(true)
    expect(w.get('.lq-ring-name').text()).toBe('Bread')
    // The thing is named once, on the ring, not under the pointer as well.
    expect(w.find('[data-area-pointer]').exists()).toBe(false)
    expect(
      w
        .findAll('.lq-press-ring .lq-ring-coin')
        .map((c) => c.attributes('data-ring-action')),
    ).toEqual(['take', 'use', 'open', 'close', 'examine'])
  })

  it('keeps the ring in the part of the picture the command bar leaves, over the words', async () => {
    await cottage()
    const box = (top: number, height: number): DOMRect =>
      ({
        left: 0,
        top,
        width: 960,
        height,
        right: 960,
        bottom: top + height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains('lq-composer')
          ? box(440, 100)
          : box(0, 540)
      },
    )
    await press('bread')
    const layer = w.get('.lq-ring-layer')
    expect(layer.element.closest('.lq-stage')).toBeNull()
    expect(layer.attributes('style')).toContain('height: 440px')
    expect(ring().exists()).toBe(true)
  })

  it('opens for a person with Talk to and the rest', async () => {
    await cottage()
    await press('grandmother')
    expect(coin('talk').exists()).toBe(true)
    expect(coin('say').exists()).toBe(true)
    expect(coin('take').exists()).toBe(false)
  })

  it('opens no ring while the game takes no move', async () => {
    const store = await cottage()
    store.acceptInput = false
    await press('bread')
    expect(ring().exists()).toBe(false)
  })

  it('opens no ring during a change of scene', async () => {
    await cottage()
    const scene = useSceneStore()
    scene.phase = 'out'
    await w.vm.$nextTick()
    await press('bread')
    expect(ring().exists()).toBe(false)
  })

  it('does not take the names away or show them by opening a ring', async () => {
    await cottage()
    await press('bread')
    expect(useAreaNamesStore().showing).toBe(false)
  })

  it('closes when the game stops taking a move', async () => {
    const store = await cottage()
    await press('bread')
    store.acceptInput = false
    await w.vm.$nextTick()
    expect(ring().exists()).toBe(false)
  })

  it('closes when its thing leaves the room', async () => {
    const store = await cottage()
    await press('bread')
    store.items = store.items.filter((i) => !/bread/i.test(i))
    store.imageManifest = {}
    await w.vm.$nextTick()
    expect(ring().exists()).toBe(false)
  })

  it('only hurries the words while they are still being told, and opens no ring', async () => {
    await cottage()
    const speech = useStageSpeechStore()
    const line = {
      shown: false,
      turnId: 1,
      key: 1,
      narrated: false,
      seen: false,
      carried: false,
    } as unknown as StageLine
    speech.conversation = { with: 'grandmother', lines: [line] }
    await w.vm.$nextTick()
    await press('bread')
    expect(ring().exists()).toBe(false)
    expect(line.shown).toBe(true)
    await press('bread')
    expect(ring().exists()).toBe(true)
  })

  it('closes when a pop-up comes up', async () => {
    const store = await cottage()
    await press('bread')
    store.showModal = true
    await w.vm.$nextTick()
    expect(ring().exists()).toBe(false)
  })

  it('opens no ring while a pop-up is up', async () => {
    const store = await cottage()
    store.showModal = true
    await w.vm.$nextTick()
    await press('bread')
    expect(ring().exists()).toBe(false)
  })

  it('puts focus on the show button once the thing taken is gone', async () => {
    await cottage()
    await press('bread')
    await coin('take').trigger('click')
    await flushPromises()
    expect(hit('bread').exists()).toBe(false)
    expect(document.activeElement).toBe(w.get('.lq-show-names').element)
  })

  it('shuts the ring on Escape first, leaving the names showing', async () => {
    await cottage()
    await w.get('.lq-show-names').trigger('click')
    expect(useAreaNamesStore().showing).toBe(true)
    await press('bread')
    await key('Escape')
    expect(ring().exists()).toBe(false)
    expect(useAreaNamesStore().showing).toBe(true)
  })

  it('lets S and the words key alone while focus is in the ring', async () => {
    await cottage()
    await press('bread')
    await key('s')
    expect(useAreaNamesStore().showing).toBe(false)
  })
})
