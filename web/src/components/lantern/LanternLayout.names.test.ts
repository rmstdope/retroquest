// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'
import { PANEL_GROUPS, useGameStore } from '@/stores/useGameStore'
import { useAreaNamesStore } from '@/stores/useAreaNamesStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { setPictureProbe } from '@/lantern/roomPicture'

/**
 * The marks and names of Elior's cottage over the real engine: the button,
 * S, Escape, the Always setting and the words folding away.
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
    always = false,
  ): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    useSettingsStore().alwaysShowNames = always
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
    return store
  }

  const button = (): ReturnType<VueWrapper['find']> => w.find('.lq-show-names')
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
    w.unmount()
    setPictureProbe(null)
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('has no button when nothing is placed', async () => {
    await cottage(false)
    expect(button().exists()).toBe(false)
    await key('s')
    expect(w.find('[data-area-mark]').exists()).toBe(false)
  })

  it('names only the things the studio has placed, as the corner names them', async () => {
    await cottage()
    expect(button().attributes('title')).toBe("Show what's here (S)")
    await button().trigger('click')
    expect(button().text()).toBe('◎ Showing')
    expect(button().attributes('title')).toBe("Show what's here (S)")
    expect(w.get('[data-area-name="bread"]').text()).toBe('Bread')
    expect(w.find('[data-area-name="hearth"]').exists()).toBe(false)
    await button().trigger('click')
    expect(w.find('[data-area-mark]').exists()).toBe(false)
  })

  it('answers S, but not while typing, with a modifier, or off the laptop', async () => {
    await cottage()
    await key('s')
    expect(useAreaNamesStore().showing).toBe(true)
    await key('S')
    expect(useAreaNamesStore().showing).toBe(false)
    await key('s', { ctrlKey: true })
    expect(useAreaNamesStore().showing).toBe(false)
    const box = document.createElement('input')
    document.body.append(box)
    await key('s', {}, box)
    expect(useAreaNamesStore().showing).toBe(false)
  })

  it('ignores S on a phone, which has the button alone', async () => {
    await cottage(true, false)
    await key('s')
    expect(useAreaNamesStore().showing).toBe(false)
    expect(button().attributes('title')).toBeUndefined()
  })

  it('takes the names away on Escape, before it does anything else', async () => {
    await cottage()
    await key('s')
    expect(useAreaNamesStore().showing).toBe(true)
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(escape)
    expect(useAreaNamesStore().showing).toBe(false)
    expect(escape.defaultPrevented).toBe(true)
  })

  it('folds the words away while the names show, and brings them back after', async () => {
    await cottage()
    expect(w.find('.lq-words-hide').exists()).toBe(true)
    await button().trigger('click')
    expect(w.find('.lq-words-hide').exists()).toBe(false)
    await button().trigger('click')
    expect(w.find('.lq-words-hide').exists()).toBe(true)
  })

  it('keeps the words where they are under the Always setting, names beside them', async () => {
    const store = await cottage(true, true, true)
    expect(store.roomAreas.things.length).toBeGreaterThan(0)
    expect(useAreaNamesStore().showing).toBe(true)
    expect(w.find('.lq-words-hide').exists()).toBe(true)
    await button().trigger('click')
    expect(useAreaNamesStore().showing).toBe(false)
    expect(w.find('.lq-words-hide').exists()).toBe(true)
  })

  it('takes the button and the names away during a change of scene, and brings them back after', async () => {
    await cottage()
    await button().trigger('click')
    expect(w.findAll('[data-area-mark]')).toHaveLength(2)
    const scene = useSceneStore()
    scene.phase = 'dark'
    await w.vm.$nextTick()
    expect(button().exists()).toBe(false)
    expect(w.find('[data-area-mark]').exists()).toBe(false)
    scene.phase = 'idle'
    await w.vm.$nextTick()
    expect(button().exists()).toBe(true)
    expect(w.findAll('[data-area-mark]')).toHaveLength(2)
  })

  it('starts the next room clean, and a load too', async () => {
    const store = await cottage()
    await button().trigger('click')
    store.loadNumber++
    await w.vm.$nextTick()
    expect(w.find('[data-area-mark]').exists()).toBe(false)
    await button().trigger('click')
    store.roomName = 'Somewhere else'
    await w.vm.$nextTick()
    expect(useAreaNamesStore().showing).toBe(false)
  })

  it('folds an arrival away for the names without ending it, and brings it back', async () => {
    await cottage()
    const arrival = useArrivalStore()
    arrival.show(
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
    const card = (): ReturnType<VueWrapper['get']> =>
      w.get('[data-testid="arrival-on-picture"]')
    expect(card().classes()).not.toContain('lq-arrival-away')
    await button().trigger('click')
    expect(card().classes()).toContain('lq-arrival-away')
    expect(arrival.active).toBe(true)
    await button().trigger('click')
    expect(card().classes()).not.toContain('lq-arrival-away')
    expect(arrival.active).toBe(true)
  })

  it('leaves an arrival where it is under the Always setting', async () => {
    await cottage(true, true, true)
    useArrivalStore().show(
      99,
      [
        {
          kind: 'description',
          lines: [{ unit: 0, markup: 'A fire crackles.' }],
          voiced: false,
        },
      ],
      false,
    )
    await w.vm.$nextTick()
    await button().trigger('click')
    await button().trigger('click')
    expect(w.get('[data-testid="arrival-on-picture"]').classes()).not.toContain(
      'lq-arrival-away',
    )
  })

  it('takes the names away on Escape even with a drawer open', async () => {
    await cottage()
    await key('s')
    await w.get('.lq-stage-buttons button').trigger('click')
    expect(useAreaNamesStore().showing).toBe(true)
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
    expect(useAreaNamesStore().showing).toBe(false)
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
    await at(wrap.element, 'click', 624, 351)
    expect(w.find('.lq-press-ring').exists()).toBe(true)
    expect(tap).not.toHaveBeenCalled()
    // Away from any dot the press is the cards' and the cursor is theirs.
    await at(wrap.element, 'pointermove', 20, 20)
    expect(wrap.attributes('style') ?? '').not.toContain('cursor')
  })
})
