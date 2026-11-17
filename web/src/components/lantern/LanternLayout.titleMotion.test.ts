// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { startedHoldStore } from '@/testing/holdGame'
import { setPictureProbe } from '@/lantern/roomPicture'

/** The title page's movement as the layout hands it over from the images manifest. */
describe("LanternLayout: the title page's movement", () => {
  let w: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    setPictureProbe(() => Promise.resolve(true))
  })
  afterEach(() => {
    w?.unmount()
    w = undefined
    setPictureProbe(null)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /** The layout with the title up and `manifest` as the images manifest. */
  async function title(manifest: unknown): Promise<VueWrapper> {
    const game = await startedHoldStore()
    useSettingsStore().reduceMotion = 'off'
    vi.spyOn(game, 'getQuickSave').mockReturnValue({
      slot: 0,
      act: 'Act 1',
      room: 'The Hall',
      timestamp: '2026-11-03T21:14:00',
      quests: null,
    })
    game.showTitle = true
    game.imageManifest = manifest
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    return w
  }

  it('zooms only, at 16 s and 3%, until the team saves settings for the title', async () => {
    const layout = await title({})
    const drift = layout.get('.lq-title-drift')
    expect(drift.attributes('style')).toContain('--lq-title-zoom-seconds: 16s')
    expect(layout.find('.lq-title-art canvas').exists()).toBe(false)
  })

  it('plays the saved zoom and effects, and keeps playing behind the Load game window', async () => {
    const layout = await title({
      'title-screen': {
        width: 1920,
        height: 1080,
        zoom: { seconds: 22, percent: 4 },
        effects: [{ kind: 'dust' }],
      },
    })
    expect(layout.get('.lq-title-drift').attributes('style')).toContain(
      '--lq-title-zoom-seconds: 22s',
    )
    expect(layout.find('.lq-title-art canvas').exists()).toBe(true)
    await layout.get('.lq-title-buttons > button:last-child').trigger('click')
    await flushPromises()
    expect(useGameStore().showTitle).toBe(true)
    expect(layout.find('.lq-title-art canvas').exists()).toBe(true)
    expect(layout.get('.lq-title-drift').classes()).toContain(
      'lq-title-drift-on',
    )
  })
})
