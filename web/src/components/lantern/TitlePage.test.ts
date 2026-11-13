// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TitlePage from './TitlePage.vue'
import type { SaveSlot } from '@/types/bridge'
import { setPictureProbe } from '@/lantern/roomPicture'
import { useSettingsStore } from '@/stores/useSettingsStore'

const CREDIT = 'Original music, images and narration made with Content Studio'

const NOW = '2026-11-03T21:14:00'
const save = (slot: number, over: Partial<SaveSlot> = {}): SaveSlot => ({
  slot,
  act: 'Act 2',
  room: 'The Old Mill',
  timestamp: NOW,
  quests: null,
  ...over,
})

describe('TitlePage', () => {
  let wrapper: VueWrapper | undefined
  beforeEach(() => {
    setActivePinia(createPinia())
    useSettingsStore().reduceMotion = 'on'
    setPictureProbe(() => Promise.resolve(true))
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    setPictureProbe(null)
  })

  function mountTitle(saves: SaveSlot[] = [], error = ''): VueWrapper {
    wrapper = mount(TitlePage, {
      props: { saves, error },
      attachTo: document.body,
    })
    return wrapper
  }

  it('is a page named RetroQuest, with the name written over the picture', () => {
    const w = mountTitle()
    const dialog = w.get('[role="dialog"]')

    expect(dialog.get(`#${dialog.attributes('aria-labelledby')}`).text()).toBe(
      'RetroQuest',
    )
    expect(w.get('.lq-welcome').text()).toBe('Welcome to')
    expect(w.get('.lq-wordmark').attributes('aria-hidden')).toBe('true')
    expect(w.get('.lq-wordmark').text()).toBe('RetroQuest')
    expect(w.find('pre').exists()).toBe(false)
  })

  it('credits Content Studio with one line, the name linking to its page', () => {
    const w = mountTitle()
    const credit = w.get('.lq-credit')

    expect(credit.text()).toBe(CREDIT)
    const link = credit.get('a')
    expect(link.text()).toBe('Content Studio')
    expect(link.attributes('href')).toBe(
      'https://github.com/rmstdope/content-studio',
    )
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
    expect(w.find('.lq-credits').exists()).toBe(false)
  })

  describe('the picture', () => {
    it('is the title picture once it exists', async () => {
      const w = mountTitle()
      await flushPromises()
      expect(w.get('.lq-title-picture').attributes('style')).toContain(
        'images/generated/title-screen.png',
      )
    })

    it('is the opening dream until the title picture is made', async () => {
      setPictureProbe((url) => Promise.resolve(!url.includes('title-screen')))
      const w = mountTitle()
      await flushPromises()
      expect(w.get('.lq-title-picture').attributes('style')).toContain(
        'images/generated/act1-the-dream.png',
      )
    })
  })

  describe('the opening', () => {
    beforeEach(() => {
      useSettingsStore().reduceMotion = 'off'
    })

    it('hides the credit and the buttons from focus until it has finished', async () => {
      const w = mountTitle()
      await flushPromises()
      expect(w.get('.lq-title-page').classes()).toContain('is-playing')
      expect(w.get('.lq-credit').attributes('inert')).toBeDefined()
      expect(w.get('.lq-title-buttons').attributes('inert')).toBeDefined()
      expect(document.activeElement).not.toBe(w.get('button').element)
    })

    it('finishes when the last button has risen, and focuses the main button', async () => {
      const w = mountTitle([save(2)])
      await w.findAll('button')[2].trigger('animationend')
      await flushPromises()
      expect(w.get('.lq-title-page').classes()).toContain('is-open')
      expect(w.get('.lq-title-buttons').attributes('inert')).toBeUndefined()
      expect(document.activeElement).toBe(w.findAll('button')[0].element)
    })

    it('is skipped by a key press, which presses nothing and starts nothing', async () => {
      const w = mountTitle()
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
      w.get('.lq-title-page').element.dispatchEvent(event)
      await flushPromises()

      expect(event.defaultPrevented).toBe(true)
      expect(w.emitted('start')).toBeUndefined()
      expect(w.get('.lq-title-page').classes()).toContain('is-open')
      expect(document.activeElement?.textContent?.trim()).toBe('Start')
    })

    it('is skipped by Escape without starting the game, which works afterwards', async () => {
      const w = mountTitle()
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toBeUndefined()
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toHaveLength(1)
    })

    it('is skipped by a press, and presses after it behave as normal', async () => {
      const w = mountTitle()
      await w.get('.lq-title-page').trigger('pointerdown')
      expect(w.get('.lq-title-page').classes()).toContain('is-open')
      await w.get('button').trigger('click')
      expect(w.emitted('start')).toHaveLength(1)
    })
  })

  it('shows everything from the first frame with less motion', async () => {
    const w = mountTitle()
    await flushPromises()
    expect(w.get('.lq-title-page').classes()).toContain('is-open')
    expect(w.get('.lq-credit').attributes('inert')).toBeUndefined()
    expect(document.activeElement?.textContent?.trim()).toBe('Start')
  })

  it('starts with the Start button, Enter or Escape', async () => {
    const w = mountTitle()
    await flushPromises()
    expect(document.activeElement?.textContent?.trim()).toBe('Start')

    await w.get('button').trigger('click')
    await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })

    expect(w.emitted('start')).toHaveLength(2)
  })

  describe('with saves', () => {
    const labels = (w: VueWrapper): string[] =>
      w.findAll('button').map((b) => b.text())

    it('offers only Start when there are no saves, and Escape starts', async () => {
      const w = mountTitle()
      expect(labels(w)).toEqual(['Start'])
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toHaveLength(1)
    })

    it('treats empty slots as no saves', () => {
      const w = mountTitle([save(1, { room: null })])
      expect(labels(w)).toEqual(['Start'])
    })

    it('offers Continue, New game and Load game, with Continue naming the save', async () => {
      const w = mountTitle([save(2)])
      await flushPromises()
      expect(
        w.findAll('button').map((b) => b.find('.lq-title-line').exists()),
      ).toEqual([true, false, false])
      expect(labels(w)[0]).toMatch(/^Continue\s*Act II · The Old Mill · /)
      expect(labels(w).slice(1)).toEqual(['New game', 'Load game'])
      expect(document.activeElement).toBe(w.findAll('button')[0].element)
    })

    it('treats a player with only named saves as returning, and names the save under Continue', () => {
      const w = mountTitle([
        save(-1, { name: 'oldrun', act: null, room: null }),
      ])
      expect(labels(w)[0]).toMatch(/^Continue\s*oldrun · 3 Nov · 21:14$/)
      expect(labels(w).slice(1)).toEqual(['New game', 'Load game'])
    })

    it('keeps Escape inert while saves exist', async () => {
      const w = mountTitle([save(2)])
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toBeUndefined()
    })

    it('emits continue, start and load from the three buttons', async () => {
      const w = mountTitle([save(2)])
      const [cont, fresh, load] = w.findAll('button')
      await cont.trigger('click')
      await fresh.trigger('click')
      await load.trigger('click')
      expect(w.emitted('continue')).toHaveLength(1)
      expect(w.emitted('start')).toHaveLength(1)
      expect(w.emitted('load')).toHaveLength(1)
    })

    it('has no Continue when every save is old: New game is main and focused', async () => {
      const w = mountTitle([save(1, { outdated: true })])
      await flushPromises()
      expect(labels(w)).toEqual(['New game', 'Load game'])
      expect(w.findAll('button')[0].classes()).toContain('lq-title-start')
      expect(document.activeElement).toBe(w.findAll('button')[0].element)
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toBeUndefined()
    })

    it('shows why a load failed', () => {
      const w = mountTitle([save(2)], 'No save file found.')
      expect(w.get('[role="alert"]').text()).toBe('No save file found.')
    })
  })
})
