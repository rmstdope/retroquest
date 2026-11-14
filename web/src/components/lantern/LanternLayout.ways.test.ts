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
import { useSceneStore } from '@/stores/useSceneStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { setPictureProbe } from '@/lantern/roomPicture'

describe('LanternLayout: leaving by pressing a way out in the picture', () => {
  let w: VueWrapper
  const PLACED = {
    'act1-eliors-cottage': {
      width: 1920,
      height: 1080,
      areas: {
        'exit-south': { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        'exit-east': { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
        bread: { x: 0.6, y: 0.6, width: 0.1, height: 0.1 },
      },
    },
  }

  async function cottage(
    laptop = true,
  ): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    useSettingsStore().alwaysShowNames = false
    setPictureProbe(() => Promise.resolve(true))
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches:
          query.includes('min-width') && (laptop || !query.includes('1024px')),
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
    store.imageManifest = PLACED
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    return store
  }

  /** Press the picture at a point of the 960×540 stage (the stage sits at the page's corner). */
  async function press(x: number, y: number): Promise<void> {
    const picture = w.get('.lq-stage-picture').element
    picture.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }),
    )
    await w.vm.$nextTick()
  }
  async function point(x: number, y: number): Promise<void> {
    const picture = w.get('.lq-stage-picture').element
    picture.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y }),
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

  it('lets the pointer name a thing on a window just under laptop width (1000px)', async () => {
    await cottage(false)
    await point(700, 400)
    expect(useAreaNamesStore().pointer).toEqual({ x: 700, y: 400 })
  })

  it('does nothing over bare painting but hurry the words', async () => {
    const store = await cottage()
    const submit = vi.spyOn(store, 'submitCommand')
    await press(900, 500)
    expect(submit).not.toHaveBeenCalled()
  })

  it('does not go while the game is not taking actions', async () => {
    const store = await cottage()
    const submit = vi.spyOn(store, 'submitCommand')
    store.acceptInput = false
    await press(100, 100)
    expect(submit).not.toHaveBeenCalled()
  })

  it('keeps the ordinary pointer over a closed way', async () => {
    await cottage()
    await point(100, 100)
    expect(w.get('.lq-stage').attributes('style') ?? '').not.toContain('cursor')
  })

  it('goes when an open way is pressed, with an arrow over it, and stops the telling', async () => {
    const store = await cottage()
    for (const command of [
      'use lantern',
      'take bread',
      'take lantern',
      'talk to grandmother',
      'use journal',
      'talk to grandmother',
    ])
      store.submitCommand(command)
    store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], false)
    await w.vm.$nextTick()
    const submit = vi.spyOn(store, 'submitCommand')
    await point(600, 100)
    expect(w.get('.lq-stage').attributes('style')).toContain('cursor')
    await press(600, 100)
    expect(submit).toHaveBeenCalledWith('go east')
  })

  it('goes when the name of an open way is pressed while the names show', async () => {
    const store = await cottage()
    for (const command of [
      'use lantern',
      'take bread',
      'take lantern',
      'talk to grandmother',
      'use journal',
      'talk to grandmother',
    ])
      store.submitCommand(command)
    store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], false)
    useAreaNamesStore().showing = true
    await w.vm.$nextTick()
    const submit = vi.spyOn(store, 'submitCommand')
    w.get('[data-area-name="exit-east"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    expect(submit).toHaveBeenCalledWith('go east')
  })

  it('does not go through an open way that lies under a mark pressed for its thing', async () => {
    const store = await cottage()
    for (const command of [
      'use lantern',
      'take lantern',
      'talk to grandmother',
      'use journal',
      'talk to grandmother',
    ])
      store.submitCommand(command)
    store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], false)
    useAreaNamesStore().showing = true
    await w.vm.$nextTick()
    const submit = vi.spyOn(store, 'submitCommand')
    // A mark stepped off the plate can stand over another thing's way: the press is still the mark's thing.
    w.get('[data-area-mark="bread"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 600, clientY: 100 }),
    )
    await w.vm.$nextTick()
    expect(submit).not.toHaveBeenCalledWith('go east')
  })

  /** Open the way east: the lantern lit, the journal read, Revive learned. */
  async function openTheWays(
    store: ReturnType<typeof useGameStore>,
  ): Promise<void> {
    for (const command of [
      'use lantern',
      'take bread',
      'take lantern',
      'talk to grandmother',
      'use journal',
      'talk to grandmother',
    ])
      store.submitCommand(command)
    store.releasePanels(store.turns.at(-1)!.id, [...PANEL_GROUPS], false)
    await w.vm.$nextTick()
  }

  it.each([
    ['name', '[data-area-name="exit-east"]'],
    ['mark', '.lq-area-mark[data-way="east"]'],
  ])(
    'leaves no arrow in the next room after the %s of a way is pressed with the pointer unmoved',
    async (_what, selector) => {
      const store = await cottage()
      await openTheWays(store)
      useAreaNamesStore().showing = true
      await w.vm.$nextTick()
      const place = w.get(selector).element
      place.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
      await w.vm.$nextTick()
      expect(w.get('.lq-stage').attributes('style')).toContain('cursor')
      place.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await w.vm.$nextTick()
      expect(store.roomName).not.toBe("Elior's Cottage")
      expect(w.get('.lq-stage').attributes('style') ?? '').not.toContain(
        'cursor',
      )
    },
  )

  it('takes the arrow away with the names when the pointer rests on a way and has not moved', async () => {
    const store = await cottage()
    await openTheWays(store)
    useAreaNamesStore().showing = true
    await w.vm.$nextTick()
    w.get('[data-area-name="exit-east"]').element.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true }),
    )
    await w.vm.$nextTick()
    expect(w.get('.lq-stage').attributes('style')).toContain('cursor')
    useAreaNamesStore().turnOff()
    await w.vm.$nextTick()
    expect(store.roomName).toBe("Elior's Cottage")
    expect(w.get('.lq-stage').attributes('style') ?? '').not.toContain('cursor')
  })

  it('stops the telling when an open way is pressed', async () => {
    const store = await cottage()
    await openTheWays(store)
    const skip = vi.spyOn(useNarrationStore(), 'skipAll')
    await press(600, 100)
    expect(skip).toHaveBeenCalled()
  })

  it('shows the arrow of that way only while a press would go', async () => {
    const store = await cottage()
    await openTheWays(store)
    await point(600, 100)
    const east = w.get('.lq-stage').attributes('style')
    expect(east).toContain(encodeURIComponent('rotate(90 16 16)'))
    store.acceptInput = false
    await w.vm.$nextTick()
    expect(w.get('.lq-stage').attributes('style') ?? '').not.toContain('cursor')
  })

  it('only brings the new room up when a press comes during a change of scene, or before a talk moved Elior is shown', async () => {
    const store = await cottage()
    await openTheWays(store)
    const submit = vi.spyOn(store, 'submitCommand')
    const reached = vi.fn()
    useStageSpeechStore().sceneChange = { turnId: 1, unit: 1, reached }
    await press(600, 100)
    expect(reached).toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
    useSceneStore().turn = 5
    await press(600, 100)
    expect(submit).not.toHaveBeenCalled()
  })

  it("takes a press on a way's dot through the words as a press on the way: it goes, and a change of scene is brought up first", async () => {
    const store = await cottage()
    await openTheWays(store)
    const submit = vi.spyOn(store, 'submitCommand')
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', bubbles: true }),
    )
    await w.vm.$nextTick()
    const story = w.get('.lq-story').element
    const dot = async (): Promise<void> => {
      const wrap = w.get('.lq-story-wrap').element
      wrap.dispatchEvent(
        new MouseEvent('pointermove', {
          clientX: 576,
          clientY: 108,
          bubbles: true,
        }),
      )
      await w.vm.$nextTick()
      story.dispatchEvent(
        new MouseEvent('click', {
          clientX: 576,
          clientY: 108,
          bubbles: true,
          cancelable: true,
        }),
      )
      await w.vm.$nextTick()
    }
    const reached = vi.fn()
    useStageSpeechStore().sceneChange = { turnId: 1, unit: 1, reached }
    await dot()
    expect(reached).toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
    useStageSpeechStore().sceneChange = null
    await dot()
    expect(submit).toHaveBeenCalledWith('go east')
  })

  it('closes an open panel and goes on the same press', async () => {
    const store = await cottage()
    await openTheWays(store)
    const quests = w
      .findAll('.lq-buttons button')
      .find((b) => /Quests/.test(b.text()))
    await quests!.trigger('click')
    const submit = vi.spyOn(store, 'submitCommand')
    const picture = w.get('.lq-stage-picture').element
    picture.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: 600,
        clientY: 100,
      }),
    )
    await press(600, 100)
    expect(w.find('.lq-drawer').exists()).toBe(false)
    expect(submit).toHaveBeenCalledWith('go east')
  })
})
