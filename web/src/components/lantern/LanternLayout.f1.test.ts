// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'

/** The note about F1 at the start of a new game, and the typing box it points to. */
describe('LanternLayout: F1 and the typing box', () => {
  let w: VueWrapper | undefined

  /** A laptop with a mouse and keyboard, or a phone (coarse, hover-less) on its side. */
  function stubScreen(phone: boolean): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: phone
          ? !query.includes('hover: hover')
          : !query.includes('coarse') && !query.includes('hover: none'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(useGameStore(), 'getQuickSave').mockReturnValue(null)
    vi.spyOn(useGameStore(), 'getNamedSaves').mockReturnValue([])
    vi.spyOn(useGameStore(), 'getSaveSlots').mockReturnValue([])
  })
  afterEach(() => {
    w?.unmount()
    w = undefined
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function startNewGame(): Promise<VueWrapper> {
    const game = useGameStore()
    game.showTitle = true
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    await w.get('.lq-title-start, [data-start]').trigger('click')
    await flushPromises()
    return w
  }

  it('says "Press F1 to type commands" at the start of a new game, then goes at the first key', async () => {
    stubScreen(false)
    const layout = await startNewGame()
    expect(layout.get('.lq-f1-note').text()).toBe('Press F1 to type commands')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    await flushPromises()
    expect(layout.find('.lq-f1-note').exists()).toBe(false)
  })

  it('goes when F1 is pressed, which brings the box up', async () => {
    stubScreen(false)
    const layout = await startNewGame()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    await flushPromises()
    expect(layout.find('.lq-f1-note').exists()).toBe(false)
    expect(layout.find('.lq-type-input').exists()).toBe(true)
  })

  it('is never shown on a phone, which has no box', async () => {
    stubScreen(true)
    const layout = await startNewGame()
    expect(layout.find('.lq-f1-note').exists()).toBe(false)
  })

  it('is not shown when a save is loaded', async () => {
    stubScreen(false)
    const game = useGameStore()
    game.showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    expect(w.find('.lq-f1-note').exists()).toBe(false)
  })

  it('starts with the box hidden, and a restart hides it again', async () => {
    stubScreen(false)
    const game = useGameStore()
    game.showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    expect(w.find('.lq-type-input').exists()).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    await flushPromises()
    expect(w.find('.lq-type-input').exists()).toBe(true)
    game.gameNumber++
    await flushPromises()
    expect(w.find('.lq-type-input').exists()).toBe(false)
  })

  it('leaves F1 alone on the title page, so the game does not begin with the box up', async () => {
    stubScreen(false)
    const game = useGameStore()
    game.showTitle = true
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    const event = new KeyboardEvent('keydown', {
      key: 'F1',
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(event)
    await flushPromises()
    expect(w.find('.lq-type-input').exists()).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })

  it('gives a narrow desktop window the box too: only a phone has none', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        // A 900 x 800 mouse window: not wide, not short, not a phone.
        matches:
          query.includes('hover: hover') || query.includes('orientation'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    useGameStore().showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    await flushPromises()
    expect(w.find('.lq-type-input').exists()).toBe(true)
  })
})
