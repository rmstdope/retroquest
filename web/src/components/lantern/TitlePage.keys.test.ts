// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TitlePage from './TitlePage.vue'
import type { SaveSlot } from '@/types/bridge'
import { setPictureProbe } from '@/lantern/roomPicture'
import { useSettingsStore } from '@/stores/useSettingsStore'

const sounds = vi.hoisted(() => ({ playMove: vi.fn(), playChoose: vi.fn() }))
vi.mock('@/composables/useUiSounds', () => ({ useUiSounds: () => sounds }))

const save = (slot: number, over: Partial<SaveSlot> = {}): SaveSlot => ({
  slot,
  act: 'Act 2',
  room: 'The Old Mill',
  timestamp: '2026-11-03T21:14:00',
  quests: null,
  ...over,
})

describe('TitlePage keyboard choice', () => {
  let wrapper: VueWrapper | undefined
  beforeEach(() => {
    setActivePinia(createPinia())
    useSettingsStore().reduceMotion = 'on'
    setPictureProbe(() => Promise.resolve(true))
    sounds.playMove.mockClear()
    sounds.playChoose.mockClear()
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    setPictureProbe(null)
  })

  async function mountTitle(saves: SaveSlot[] = []): Promise<VueWrapper> {
    wrapper = mount(TitlePage, { props: { saves }, attachTo: document.body })
    await flushPromises()
    return wrapper
  }
  const buttons = (w: VueWrapper): HTMLElement[] =>
    w.findAll('.lq-title-buttons > button').map((b) => b.element as HTMLElement)
  async function press(w: VueWrapper, key: string): Promise<void> {
    await w.get('section').trigger('keydown', { key })
  }

  it('rings the main choice on arrival, without a sound', async () => {
    const w = await mountTitle([save(2)])
    expect(document.activeElement).toBe(buttons(w)[0])
    expect(sounds.playMove).not.toHaveBeenCalled()
  })

  it('moves the ring down and up the choices, wrapping, with a ting each time', async () => {
    const w = await mountTitle([save(2)])
    const [cont, fresh, load] = buttons(w)
    await press(w, 'ArrowDown')
    expect(document.activeElement).toBe(fresh)
    await press(w, 'ArrowDown')
    expect(document.activeElement).toBe(load)
    await press(w, 'ArrowDown')
    expect(document.activeElement).toBe(cont)
    await press(w, 'ArrowUp')
    expect(document.activeElement).toBe(load)
    expect(sounds.playMove).toHaveBeenCalledTimes(4)
  })

  it('wraps between two choices when every save is old', async () => {
    const w = await mountTitle([save(1, { outdated: true })])
    const [fresh, load] = buttons(w)
    await press(w, 'ArrowDown')
    expect(document.activeElement).toBe(load)
    await press(w, 'ArrowDown')
    expect(document.activeElement).toBe(fresh)
  })

  it('moves nothing and makes no sound with Start alone', async () => {
    const w = await mountTitle()
    await press(w, 'ArrowDown')
    await press(w, 'ArrowUp')
    expect(document.activeElement).toBe(buttons(w)[0])
    expect(sounds.playMove).not.toHaveBeenCalled()
  })

  it('puts the ring on the first choice with down and the last with up from the credit link', async () => {
    const w = await mountTitle([save(2)])
    const link = w.get('.lq-credit a').element as HTMLElement
    link.focus()
    await press(w, 'ArrowDown')
    expect(document.activeElement).toBe(buttons(w)[0])
    link.focus()
    await press(w, 'ArrowUp')
    expect(document.activeElement).toBe(buttons(w)[2])
  })

  it('moves the ring onto a choice the pointer enters, once', async () => {
    const w = await mountTitle([save(2)])
    const fresh = w.findAll('.lq-title-buttons > button')[1]
    await fresh.trigger('mouseenter')
    expect(document.activeElement).toBe(fresh.element)
    await fresh.trigger('mouseenter')
    expect(sounds.playMove).toHaveBeenCalledTimes(1)
  })

  it('plays no ting when focus returns to Load game', async () => {
    const w = await mountTitle([save(2)])
    ;(w.vm as unknown as { focusLoad: () => void }).focusLoad()
    expect(document.activeElement).toBe(buttons(w)[2])
    expect(sounds.playMove).not.toHaveBeenCalled()
  })

  it('latches when a choice is made by click, and Escape chooses nothing', async () => {
    const w = await mountTitle()
    await w.get('button').trigger('click')
    await press(w, 'Escape')
    expect(sounds.playChoose).toHaveBeenCalledTimes(1)
  })

  it('tings when Tab-like focus moves from one choice to another', async () => {
    const w = await mountTitle([save(2)])
    buttons(w)[1].focus()
    expect(sounds.playMove).toHaveBeenCalledTimes(1)
  })

  it('does not latch on the click of the press that skipped the opening', async () => {
    useSettingsStore().reduceMotion = 'off'
    const w = await mountTitle([save(2)])
    window.dispatchEvent(new Event('pointerdown'))
    await w.get('.lq-title-buttons > button').trigger('click')
    expect(sounds.playChoose).not.toHaveBeenCalled()
  })

  it('does not move the ring or sound while the opening plays; a key only finishes it', async () => {
    useSettingsStore().reduceMotion = 'off'
    const w = await mountTitle([save(2)])
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(event)
    await flushPromises()
    expect(w.get('.lq-title-page').classes()).toContain('is-open')
    expect(document.activeElement).toBe(buttons(w)[0])
    expect(sounds.playMove).not.toHaveBeenCalled()
  })
})
