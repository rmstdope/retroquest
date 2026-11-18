// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { usePassageStore, PASSAGE_HALF_MS } from '@/stores/usePassageStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * The passage through the dark into a started game (rq-umlh): the title fades
 * out, the intro rises, a press only skips, and nothing takes focus until the
 * screen is up.
 */
describe('LanternLayout: the passage into a new game', () => {
  let w: VueWrapper

  /** Mount the title page over the first act's chapter page, motion on. */
  async function title(): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    useSettingsStore().reduceMotion = 'off'
    const game = useGameStore()
    game.modalChapter = {
      kind: 'intro',
      act: 'Act I',
      title: 'The Call to Adventure',
      body: 'You are Elior.',
    }
    game.showModal = true
    game.showTitle = true
    w = mount(LanternLayout, { attachTo: document.body })
    await flushPromises()
    await w.get('.lq-title-page').trigger('pointerdown')
    await flushPromises()
    return game
  }

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    w.unmount()
    vi.useRealTimers()
  })

  it('fades the title out, then the intro rises, and focus lands only once it is up', async () => {
    await title()
    await w.get('.lq-title-start').trigger('pointerdown')
    await w.get('.lq-title-start').trigger('click')
    expect(w.get('.lq-passage').classes()).toContain('lq-passage-out')
    expect(w.find('.lq-title-start').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(PASSAGE_HALF_MS)
    expect(w.find('.lq-title-start').exists()).toBe(false)
    expect(w.find('.lq-chapter-dialog').exists()).toBe(true)
    expect(document.activeElement?.className ?? '').not.toContain(
      'lq-chapter-button',
    )

    await vi.advanceTimersByTimeAsync(PASSAGE_HALF_MS)
    await flushPromises()
    expect(w.get('.lq-passage').classes()).toContain('lq-passage-idle')
    expect(document.activeElement?.className).toContain('lq-chapter-button')
  })

  it('a click on the fading title only brings the intro up: it does not press its button', async () => {
    const game = await title()
    await w.get('.lq-title-start').trigger('pointerdown')
    await w.get('.lq-title-start').trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    await w.get('.lq-title-page').trigger('click')
    await flushPromises()
    expect(usePassageStore().phase).toBe('idle')
    expect(w.find('.lq-title-start').exists()).toBe(false)
    expect(game.showModal).toBe(true)
  })

  it('Enter during the fade brings the intro up and does nothing else', async () => {
    const game = await title()
    await w.get('.lq-title-start').trigger('pointerdown')
    await w.get('.lq-title-start').trigger('click')
    await vi.advanceTimersByTimeAsync(PASSAGE_HALF_MS + 200)
    const chapter = w.get('.lq-chapter-dialog')
    await chapter.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(usePassageStore().phase).toBe('idle')
    expect(game.showModal).toBe(true)
  })

  it('Enter with focus on the page itself (the Start button is gone) still skips', async () => {
    await title()
    await w.get('.lq-title-start').trigger('pointerdown')
    await w.get('.lq-title-start').trigger('click')
    await vi.advanceTimersByTimeAsync(PASSAGE_HALF_MS + 200)
    expect(usePassageStore().phase).toBe('in')
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
    expect(usePassageStore().phase).toBe('idle')
  })

  it('a press on the old screen while it fades out only skips: it is not carried out in the new game', async () => {
    await title()
    await w.get('.lq-title-start').trigger('pointerdown')
    await w.get('.lq-title-start').trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    const pressed = vi.fn()
    document.body.addEventListener('click', pressed)
    document.body.click()
    document.body.removeEventListener('click', pressed)
    expect(usePassageStore().phase).toBe('idle')
    expect(pressed).not.toHaveBeenCalled()
  })

  it('goes straight to the intro with no fade when motion is reduced', async () => {
    await title()
    useSettingsStore().reduceMotion = 'on'
    await w.get('.lq-title-start').trigger('pointerdown')
    await w.get('.lq-title-start').trigger('click')
    await flushPromises()
    expect(w.find('.lq-title-start').exists()).toBe(false)
    expect(usePassageStore().phase).toBe('idle')
    expect(document.activeElement?.className).toContain('lq-chapter-button')
  })
})
