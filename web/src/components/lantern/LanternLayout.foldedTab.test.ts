// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'
import { PANEL_GROUPS, useGameStore } from '@/stores/useGameStore'
import { useBeltStore } from '@/stores/useBeltStore'
import { setPictureProbe } from '@/lantern/roomPicture'

/** The height the belt and its folded tab measure in this test (px). */
const BELT_PX = 84

/**
 * The folded leather tab on a narrow desktop window (the phone-stage layout):
 * the story keeps clear of the tab's height, as it does of the open strap.
 */
describe('LanternLayout: the folded leather tab on a narrow desktop window', () => {
  let w: VueWrapper
  let original: PropertyDescriptor | undefined

  beforeEach(async () => {
    setActivePinia(createPinia())
    setPictureProbe(() => Promise.resolve(true))
    // No query matches: not a laptop, not a phone, not short: the phone stage.
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => undefined,
      clear: () => undefined,
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    )
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => BELT_PX,
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
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
  })
  afterEach(() => {
    w.unmount()
    setPictureProbe(null)
    document.body.innerHTML = ''
    if (original)
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original)
    else Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight')
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const beltRoom = (): string =>
    (w.get('.lq-main').element as HTMLElement).style.getPropertyValue(
      '--lq-belt-h',
    )

  it('keeps the story clear of the folded tab by its height', async () => {
    expect(w.find('.lq-main').classes()).toContain('lq-phone')
    expect(beltRoom()).toBe(`${BELT_PX}px`)
    useBeltStore().putAway()
    await flushPromises()
    expect(beltRoom()).toBe(`${BELT_PX}px`)
  })
})
