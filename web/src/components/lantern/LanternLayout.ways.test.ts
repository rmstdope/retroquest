// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'
import { PANEL_GROUPS, useGameStore } from '@/stores/useGameStore'
import { useAreaNamesStore } from '@/stores/useAreaNamesStore'
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

  it('answers a press on a closed way as the typed direction does, and Elior stays', async () => {
    const store = await cottage()
    const submit = vi.spyOn(store, 'submitCommand')
    await press(100, 100)
    expect(submit).toHaveBeenCalledWith('go south')
    expect(store.roomName).toBe("Elior's Cottage")
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
})
