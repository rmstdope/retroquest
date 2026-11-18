// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'
import { PANEL_GROUPS, useGameStore } from '@/stores/useGameStore'
import { useAreaNamesStore } from '@/stores/useAreaNamesStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useBeltStore } from '@/stores/useBeltStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { setPictureProbe } from '@/lantern/roomPicture'

/**
 * The marks and names of Elior's cottage over the real engine: the inputs
 * that bring them in, the 4 seconds, and what holds them away.
 */
describe('LanternLayout: what is here, named on the picture', () => {
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

  /** Mount the cottage on a laptop (or a phone) with its things placed, or not. */
  async function cottage(
    placed = true,
    laptop = true,
    settled = false,
  ): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    setPictureProbe(() => Promise.resolve(true))
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: laptop && query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(960)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(540)
    if (settled)
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
    if (placed) store.imageManifest = PLACED
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    if (settled) {
      // The turn's words are settled (a press while they are told only hurries them).
      useNarrationStore().skipAll()
      useStageSpeechStore().revealAll()
      await flushPromises()
    }
    return store
  }

  /** A pointer event of a kind (mouse or touch) on an element. */
  const pointer = async (
    el: Element,
    type: 'pointermove' | 'pointerdown',
    pointerType = 'mouse',
  ): Promise<void> => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'pointerType', { value: pointerType })
    el.dispatchEvent(event)
    await w.vm.$nextTick()
  }
  /** A tap with a finger: the touch press, then the click that follows it. */
  const tap = async (el: Element): Promise<void> => {
    await pointer(el, 'pointerdown', 'touch')
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await w.vm.$nextTick()
  }
  const picture = (): Element => w.get('.lq-stage-picture').element
  const marks = (): number => w.findAll('[data-area-mark]').length

  const key = async (
    k: string,
    init: KeyboardEventInit = {},
    target: EventTarget = document,
  ): Promise<void> => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }),
    )
    await w.vm.$nextTick()
  }

  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  })
  afterEach(() => {
    vi.useRealTimers()
    w.unmount()
    setPictureProbe(null)
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('has no button and no S key, and arrives clean', async () => {
    await cottage()
    expect(w.find('.lq-show-names').exists()).toBe(false)
    expect(marks()).toBe(0)
    await key('s')
    expect(useAreaNamesStore().showing).toBe(true)
  })

  it('shows nothing when nothing is placed', async () => {
    await cottage(false)
    await pointer(picture(), 'pointermove')
    await key('x')
    expect(marks()).toBe(0)
  })

  it('names only the things the studio has placed, when the mouse moves over the picture', async () => {
    await cottage()
    await pointer(picture(), 'pointermove')
    expect(w.get('[data-area-name="bread"]').text()).toBe('Bread')
    expect(w.find('[data-area-name="hearth"]').exists()).toBe(false)
  })

  it('goes 4 seconds after the last input, and a new input brings them back', async () => {
    vi.useFakeTimers()
    await cottage()
    await pointer(picture(), 'pointermove')
    vi.advanceTimersByTime(3000)
    await pointer(picture(), 'pointermove')
    vi.advanceTimersByTime(3000)
    expect(useAreaNamesStore().showing).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(useAreaNamesStore().showing).toBe(false)
    await pointer(picture(), 'pointermove')
    expect(useAreaNamesStore().showing).toBe(true)
    vi.useRealTimers()
  })

  it('answers a key, but not one typed in the command line', async () => {
    await cottage()
    const box = document.createElement('input')
    document.body.append(box)
    await key('a', {}, box)
    expect(useAreaNamesStore().showing).toBe(false)
    await key('a')
    expect(useAreaNamesStore().showing).toBe(true)
  })

  it('does not answer the mouse over the story words, but does a tap on the picture', async () => {
    await cottage()
    await pointer(w.get('.lq-story-wrap').element, 'pointermove')
    expect(useAreaNamesStore().showing).toBe(false)
    await tap(w.get('.lq-story-wrap').element)
    expect(useAreaNamesStore().showing).toBe(false)
    await pointer(picture(), 'pointermove', 'touch')
    expect(useAreaNamesStore().showing).toBe(false)
    await tap(picture())
    expect(useAreaNamesStore().showing).toBe(true)
  })

  it('answers a tap on a phone too, and a mouse press does not count by itself', async () => {
    await cottage(true, false)
    await pointer(picture(), 'pointerdown', 'mouse')
    expect(useAreaNamesStore().showing).toBe(false)
    await tap(picture())
    expect(useAreaNamesStore().showing).toBe(true)
  })

  it('leaves the names showing on Escape, to fade by themselves', async () => {
    await cottage()
    await key('s')
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(escape)
    expect(useAreaNamesStore().showing).toBe(true)
  })

  it('never folds the words away for the names', async () => {
    await cottage()
    expect(w.find('.lq-words-hide').exists()).toBe(true)
    await pointer(picture(), 'pointermove')
    expect(marks()).toBe(2)
    expect(w.find('.lq-words-hide').exists()).toBe(true)
  })

  it('takes the names away during a change of scene and gives none to input then', async () => {
    await cottage()
    await pointer(picture(), 'pointermove')
    expect(marks()).toBe(2)
    const scene = useSceneStore()
    scene.phase = 'dark'
    await w.vm.$nextTick()
    expect(marks()).toBe(0)
    await pointer(picture(), 'pointermove')
    scene.phase = 'idle'
    await w.vm.$nextTick()
    expect(marks()).toBe(0)
    await pointer(picture(), 'pointermove')
    expect(marks()).toBe(2)
  })

  it('counts nothing over the arrival words, the typing box or the plate, only over the picture', async () => {
    await cottage()
    for (const sel of ['.lq-stage-box', '.lq-stage-plate', '.lq-belt']) {
      const el = w.find(sel)
      if (!el.exists()) continue
      await pointer(el.element, 'pointermove')
      await tap(el.element)
      expect(useAreaNamesStore().showing).toBe(false)
    }
  })

  it('counts a move of the mouse over the picture while something is held from the belt', async () => {
    await cottage()
    useBeltStore().takeInHand({
      kind: 'item',
      name: 'bread',
      label: 'Bread',
      verb: 'usewith',
    })
    await w.vm.$nextTick()
    await pointer(picture(), 'pointermove')
    expect(useAreaNamesStore().showing).toBe(true)
  })

  it('opens only the ring on a tap on a thing, and brings the marks in as the ring closes', async () => {
    const store = await cottage(true, true, true)
    store.acceptInput = true
    await tap(w.get('[data-area-press="bread"]').element)
    expect(w.find('.lq-press-ring').exists()).toBe(true)
    expect(useAreaNamesStore().showing).toBe(false)
    vi.useFakeTimers()
    ;(document.activeElement ?? document).dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.find('.lq-press-ring').exists()).toBe(false)
    expect(useAreaNamesStore().showing).toBe(true)
    vi.advanceTimersByTime(4000)
    expect(useAreaNamesStore().showing).toBe(false)
    vi.useRealTimers()
  })

  it('lets the marks leave, not stay hidden for good, when a ring opens over them', async () => {
    const store = await cottage(true, true, true)
    store.acceptInput = true
    await pointer(picture(), 'pointermove')
    expect(marks()).toBe(2)
    await tap(w.get('[data-area-press="bread"]').element)
    expect(w.find('.lq-press-ring').exists()).toBe(true)
    expect(useAreaNamesStore().showing).toBe(false)
  })

  it('keeps the marks away when the ring closes on a choice that starts a scene change', async () => {
    const store = await cottage(true, true, true)
    store.acceptInput = true
    await tap(w.get('[data-area-press="bread"]').element)
    useSceneStore().phase = 'dark'
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.find('.lq-press-ring').exists()).toBe(false)
    expect(useAreaNamesStore().showing).toBe(false)
  })

  it('shows none while a dialog is open, at the ending, and hides them when one opens', async () => {
    const store = await cottage()
    await pointer(picture(), 'pointermove')
    store.showModal = true
    await w.vm.$nextTick()
    expect(marks()).toBe(0)
    await pointer(picture(), 'pointermove')
    expect(useAreaNamesStore().showing).toBe(false)
    store.showModal = false
    await w.vm.$nextTick()
    await pointer(picture(), 'pointermove')
    expect(marks()).toBe(2)
  })

  it('starts the next room clean, and a load too', async () => {
    const store = await cottage()
    await pointer(picture(), 'pointermove')
    store.loadNumber++
    await w.vm.$nextTick()
    expect(marks()).toBe(0)
    await pointer(picture(), 'pointermove')
    store.roomName = 'Somewhere else'
    await w.vm.$nextTick()
    expect(useAreaNamesStore().showing).toBe(false)
  })

  it('leaves an arrival where it is when the names come in', async () => {
    await cottage()
    useArrivalStore().show(
      99,
      [
        {
          kind: 'description',
          lines: [{ unit: 0, markup: 'A fire crackles.' }],
          voiced: true,
        },
      ],
      true,
    )
    await w.vm.$nextTick()
    await pointer(picture(), 'pointermove')
    expect(marks()).toBe(2)
    expect(useArrivalStore().active).toBe(true)
  })

  it('takes a press on a dot that shows through the words as a press on its thing, and never hurries the narration (rq-njoa)', async () => {
    await cottage()
    await key('s')
    const narration = useNarrationStore()
    const tap = vi.spyOn(narration, 'tap')
    const wrap = w.get('.lq-story-wrap')
    const at = async (
      el: Element,
      type: string,
      clientX: number,
      clientY: number,
    ): Promise<void> => {
      el.dispatchEvent(
        new MouseEvent(type, {
          clientX,
          clientY,
          bubbles: true,
          cancelable: true,
        }),
      )
      await w.vm.$nextTick()
    }
    // The bread's dot (0.65, 0.65 of the 960 x 540 picture) lies under the words here.
    await at(wrap.element, 'pointermove', 624, 351)
    expect(wrap.attributes('style')).toContain('cursor: pointer')
    // The press lands on the words (inside the story, where a card hurries the narration), at the dot.
    const story = w.get('.lq-story').element
    await at(story, 'click', 624, 351)
    expect(w.find('.lq-press-ring').exists()).toBe(true)
    expect(tap).not.toHaveBeenCalled()
    // Away from any dot the press is the cards' and the cursor is theirs.
    await at(wrap.element, 'pointermove', 20, 20)
    expect(wrap.attributes('style') ?? '').not.toContain('cursor')
    await at(story, 'click', 20, 20)
    expect(tap).toHaveBeenCalledTimes(1)
  })
})
