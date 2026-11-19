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
import { useArrivalStore } from '@/stores/useArrivalStore'
import { HOLD_TO_SKIP_MS } from '@/composables/useHoldToSkip'
import { useSceneStore } from '@/stores/useSceneStore'
import { setPictureProbe } from '@/lantern/roomPicture'

/**
 * Pressing a thing on the picture of Elior's cottage over the real engine:
 * the ring, what it sends, and when it opens, closes and gives focus back.
 */
describe('LanternLayout: pressing a thing on the picture', () => {
  let w: VueWrapper
  let bridge: ReturnType<typeof useBridge>
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
    bridge = useBridge(async (): Promise<ActClass[]> => [Act1])
    store.setBridge(bridge)
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

  it('offers Open between Use and Examine on what the engine says answers it, and Close on nothing', async () => {
    await cottage()
    vi.spyOn(bridge.controller, 'canOpenItem').mockImplementation(
      (name: string) => name === 'bread',
    )
    await press('bread')
    expect(
      w
        .findAll('.lq-press-ring .lq-ring-coin')
        .map((c) => c.attributes('data-ring-action')),
    ).toEqual(['take', 'use', 'open', 'examine'])
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
    ).toEqual(['take', 'use', 'examine'])
  })

  it('keeps the ring in the part of the picture the typing box leaves, over the words', async () => {
    await cottage()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    await flushPromises()
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
        return this.classList.contains('lq-stage-box')
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
      speaker: 'Grandmother',
      markup: 'Mind the bread.',
    } as unknown as StageLine
    speech.conversation = { with: 'grandmother', lines: [line] }
    await w.vm.$nextTick()
    await press('bread')
    expect(ring().exists()).toBe(false)
    expect(line.shown).toBe(true)
    await press('bread')
    expect(ring().exists()).toBe(true)
  })

  it('opens the ring on the first press once a narrated talk has been told (rq-v29l.4)', async () => {
    await cottage()
    const speech = useStageSpeechStore()
    // Grandmother's narrated line, read to its end: the narrator is done with its turn.
    const line = {
      shown: false,
      turnId: 1,
      unit: 0,
      firstWord: 0,
      key: 1,
      narrated: true,
      seen: false,
      carried: false,
      speaker: 'Grandmother',
      markup: 'Mind the bread.',
    } as unknown as StageLine
    speech.conversation = { with: 'grandmother', lines: [line] }
    await w.vm.$nextTick()
    expect(speech.visible).toHaveLength(1)
    expect(useNarrationStore().isNarrating).toBe(false)
    await press('bread')
    expect(ring().exists()).toBe(true)
  })

  it("opens no ring from a press on a thing just as the arrival went by itself, but opens it from the thing's mark (rq-v29l.4)", async () => {
    await cottage()
    useArrivalStore().lingering = true
    await press('bread')
    expect(ring().exists()).toBe(false)
    useAreaNamesStore().showing = true
    await flushPromises()
    w.get('[data-area-mark="bread"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 400, clientY: 300 }),
    )
    await flushPromises()
    expect(ring().exists()).toBe(true)
  })

  /** Press `id` down for `ms` of real time, then let go: the browser's click follows. */
  const holdOn = async (id: string, ms: number): Promise<void> => {
    const pointer = (type: string): void => {
      hit(id).element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          button: 0,
          isPrimary: true,
          pointerId: 1,
          clientX: 400,
          clientY: 300,
        }),
      )
    }
    pointer('pointerdown')
    await new Promise((r) => setTimeout(r, ms))
    pointer('pointerup')
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

  it('skips a narrated examine when a thing is held while it is told, and opens no ring (rq-w30z)', async () => {
    await cottage()
    const narration = useNarrationStore()
    // A voice that plays until it is stopped.
    narration.setAudioFactory(() => ({
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
      play: () => Promise.resolve(),
      pause: () => {},
    }))
    const voiced = (markup: string) => ({
      kind: 'block' as const,
      parts: [
        {
          markup,
          clip: {
            file: 'x.mp3',
            speaker: 'narrator',
            duration: 5,
            words: [],
          },
        },
      ],
    })
    // Two blocks: a click would only hurry to the second; the hold skips both.
    narration.begin(77, [voiced('A loaf.'), voiced('A crust.')], 'act1')
    await flushPromises()
    expect(
      useStageSpeechStore().conversation?.lines.some((l) => !l.shown),
    ).not.toBe(true)
    expect(narration.isNarrating).toBe(true)
    await holdOn('bread', HOLD_TO_SKIP_MS + 50)
    expect(narration.isNarrating).toBe(false)
    expect(ring().exists()).toBe(false)
  })

  it("still opens a thing's ring from a slow press while an unnarrated arrival is on the picture", async () => {
    await cottage()
    useArrivalStore().show(
      99,
      [
        {
          kind: 'description',
          lines: [{ unit: 0, markup: 'A room.' }],
          voiced: false,
        },
      ],
      false,
    )
    await flushPromises()
    expect(useArrivalStore().active).toBe(true)
    await holdOn('bread', 300)
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

  it('takes the names away while a ring is open, and brings them back as Escape shuts it', async () => {
    await cottage()
    useAreaNamesStore().bump()
    expect(useAreaNamesStore().showing).toBe(true)
    await press('bread')
    expect(useAreaNamesStore().showing).toBe(false)
    await key('Escape')
    await w.vm.$nextTick()
    expect(ring().exists()).toBe(false)
    expect(useAreaNamesStore().showing).toBe(true)
  })
})
