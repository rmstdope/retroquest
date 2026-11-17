// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TitlePage from './TitlePage.vue'
import {
  GAME_FULL_NAME,
  GAME_NAME,
  GAME_NAME_EYEBROW,
  GAME_NAME_WORDMARK,
  GAME_SUBTITLE,
} from '@/engine'
import type { SaveSlot } from '@/types/bridge'
import { setPictureProbe } from '@/lantern/roomPicture'
import type { ImageZoom, MotionSpec } from '@/lantern/roomMotion'
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

  it("is a page named by the game's full name, with the name written over the picture", () => {
    const w = mountTitle()
    const dialog = w.get('[role="dialog"]')

    expect(dialog.get(`#${dialog.attributes('aria-labelledby')}`).text()).toBe(
      GAME_FULL_NAME,
    )
    expect(w.get('.lq-title-eyebrow').attributes('aria-hidden')).toBe('true')
    expect(w.get('.lq-title-eyebrow').text()).toBe(GAME_NAME_EYEBROW)
    expect(w.get('.lq-wordmark').attributes('aria-hidden')).toBe('true')
    expect(w.get('.lq-wordmark').text()).toBe(GAME_NAME_WORDMARK)
    expect(
      `${w.get('.lq-title-eyebrow').text()} ${w.get('.lq-wordmark').text()}`,
    ).toBe(GAME_NAME)
    expect(w.get('.lq-subtitle').attributes('aria-hidden')).toBe('true')
    expect(w.get('.lq-subtitle').text()).toBe(GAME_SUBTITLE)
    expect(w.find('.lq-welcome').exists()).toBe(false)
    expect(w.find('.lq-title-rule').exists()).toBe(false)
    expect(w.get('.lq-title-name').findAll('.lq-subtitle')).toHaveLength(1)
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

    it('is not in the page until it has loaded, so it fades in when it arrives', async () => {
      let answer: (loaded: boolean) => void = () => undefined
      setPictureProbe(
        () => new Promise<boolean>((resolve) => (answer = resolve)),
      )
      const w = mountTitle()
      await flushPromises()
      expect(w.find('.lq-title-picture').exists()).toBe(false)
      expect(w.find('.lq-title-name').exists()).toBe(true)
      expect(w.find('button').exists()).toBe(true)

      answer(true)
      await flushPromises()
      expect(w.find('.lq-title-picture').exists()).toBe(true)
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

  describe("the painting's movement", () => {
    const DUST: MotionSpec[] = [{ kind: 'dust' }]

    beforeEach(() => {
      useSettingsStore().reduceMotion = 'off'
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    })

    /** A title page with the given movement and zoom, its picture up. */
    async function mountMoving(
      props: { motion?: MotionSpec[]; zoom?: ImageZoom | null } = {},
    ): Promise<VueWrapper> {
      wrapper = mount(TitlePage, { props, attachTo: document.body })
      await flushPromises()
      return wrapper
    }

    it('zooms from the first moment, in the 16 s and 3% the team has not yet changed', async () => {
      const w = await mountMoving()
      const art = w.get('.lq-title-art')
      const drift = art.get('.lq-title-drift')
      expect(drift.classes()).toContain('lq-title-drift-on')
      expect(drift.attributes('style')).toContain(
        '--lq-title-zoom-seconds: 16s',
      )
      expect(drift.attributes('style')).toContain('--lq-title-zoom-percent: 3')
      expect(w.find('canvas').exists()).toBe(false)
    })

    it('zooms at the seconds and size the team saved', async () => {
      const w = await mountMoving({ zoom: { seconds: 20, percent: 5 } })
      const style = w.get('.lq-title-drift').attributes('style')
      expect(style).toContain('--lq-title-zoom-seconds: 20s')
      expect(style).toContain('--lq-title-zoom-percent: 5')
    })

    it('does not zoom when the zoom is off, and its effects still play', async () => {
      const w = await mountMoving({ zoom: null, motion: DUST })
      expect(w.get('.lq-title-drift').classes()).not.toContain(
        'lq-title-drift-on',
      )
      expect(w.find('canvas').exists()).toBe(true)
    })

    it('draws the saved effects on the painting, inside the zooming layer with the picture', async () => {
      const w = await mountMoving({ motion: DUST })
      const drift = w.get('.lq-title-drift')
      expect(drift.find('.lq-title-picture').exists()).toBe(true)
      expect(drift.find('canvas').exists()).toBe(true)
    })

    it('keeps the name, the credit, the buttons and the shade out of the zoom', async () => {
      const w = await mountMoving({ motion: DUST })
      const drift = w.get('.lq-title-drift').element
      for (const selector of [
        '.lq-title-name',
        '.lq-credit',
        '.lq-title-buttons',
        '.lq-title-shade',
      ])
        expect(drift.contains(w.get(selector).element), selector).toBe(false)
    })

    it('draws no effects over the opening dream that stands in for the title picture', async () => {
      setPictureProbe((url) => Promise.resolve(!url.includes('title-screen')))
      const w = await mountMoving({ motion: DUST })
      expect(w.find('.lq-title-picture').exists()).toBe(true)
      expect(w.find('canvas').exists()).toBe(false)
    })

    it('stops everything at once under Reduce motion, and starts again when it is off', async () => {
      const w = await mountMoving({ motion: DUST })
      useSettingsStore().reduceMotion = 'on'
      await flushPromises()
      expect(w.get('.lq-title-drift').classes()).not.toContain(
        'lq-title-drift-on',
      )
      expect(w.find('canvas').exists()).toBe(false)
      useSettingsStore().reduceMotion = 'off'
      await flushPromises()
      expect(w.get('.lq-title-drift').classes()).toContain('lq-title-drift-on')
      expect(w.find('canvas').exists()).toBe(true)
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

    it('is skipped by a key press while focus is on the body, outside the page', async () => {
      const w = mountTitle()
      ;(document.activeElement as HTMLElement | null)?.blur()
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
      document.body.dispatchEvent(event)
      await flushPromises()

      expect(event.defaultPrevented).toBe(true)
      expect(w.emitted('start')).toBeUndefined()
      expect(w.get('.lq-title-page').classes()).toContain('is-open')
      expect(document.activeElement?.textContent?.trim()).toBe('Start')
    })

    it('is skipped by Tab while focus is on the body', async () => {
      const w = mountTitle()
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
      )
      await flushPromises()
      expect(w.get('.lq-title-page').classes()).toContain('is-open')
    })

    it('keeps the press that skipped it from moving focus off the main button', async () => {
      const w = mountTitle()
      document.body.dispatchEvent(
        new Event('pointerdown', { bubbles: true, cancelable: true }),
      )
      await flushPromises()
      const mousedown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      })
      w.get('.lq-title-page').element.dispatchEvent(mousedown)
      expect(mousedown.defaultPrevented).toBe(true)
      expect(document.activeElement?.textContent?.trim()).toBe('Start')
      w.get('.lq-title-page').element.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
      const later = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      })
      w.get('.lq-title-page').element.dispatchEvent(later)
      expect(later.defaultPrevented).toBe(false)
    })

    it('swallows the click that ends the skipping press, once', async () => {
      const w = mountTitle()
      document.body.dispatchEvent(
        new Event('pointerdown', { bubbles: true, cancelable: true }),
      )
      await flushPromises()
      const start = w.get('button').element
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })
      start.dispatchEvent(click)
      expect(click.defaultPrevented).toBe(true)
      expect(w.emitted('start')).toBeUndefined()
      await w.get('button').trigger('pointerdown')
      await w.get('button').trigger('click')
      expect(w.emitted('start')).toHaveLength(1)
    })

    it('lets the skipping click reach a bubble-phase window listener, as the music does', async () => {
      const w = mountTitle()
      document.body.dispatchEvent(
        new Event('pointerdown', { bubbles: true, cancelable: true }),
      )
      await flushPromises()
      const heard = vi.fn()
      window.addEventListener('click', heard)
      w.get('button').element.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      )
      window.removeEventListener('click', heard)
      expect(heard).toHaveBeenCalledTimes(1)
      expect(w.emitted('start')).toBeUndefined()
    })

    it('ends its guard at a key press when the gesture never clicked', async () => {
      const w = mountTitle()
      document.body.dispatchEvent(
        new Event('pointerdown', { bubbles: true, cancelable: true }),
      )
      await flushPromises()
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
      await w.get('button').trigger('click')
      expect(w.emitted('start')).toHaveLength(1)
    })

    it('ends its guard at the next press when the gesture never clicked', async () => {
      const w = mountTitle()
      document.body.dispatchEvent(
        new Event('pointerdown', { bubbles: true, cancelable: true }),
      )
      await flushPromises()
      document.body.dispatchEvent(
        new Event('pointerdown', { bubbles: true, cancelable: true }),
      )
      const mousedown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      })
      document.body.dispatchEvent(mousedown)
      expect(mousedown.defaultPrevented).toBe(false)
      await w.get('button').trigger('click')
      expect(w.emitted('start')).toHaveLength(1)
    })

    it('stops listening on the window once it is unmounted', async () => {
      const w = mountTitle()
      w.unmount()
      wrapper = undefined
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
      document.body.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    })

    it('is not finished by a button other than the last one rising', async () => {
      const w = mountTitle([save(2)])
      await w.findAll('button')[0].trigger('animationend')
      expect(w.get('.lq-title-page').classes()).toContain('is-playing')
    })

    it('is skipped by Space, which presses nothing', async () => {
      const w = mountTitle()
      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      })
      w.get('.lq-title-page').element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      expect(w.emitted('start')).toBeUndefined()
    })

    it('does not start on Escape, and Escape does not skip the opening', async () => {
      const w = mountTitle()
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toBeUndefined()
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toBeUndefined()
    })

    it('is skipped by a press, and presses after it behave as normal', async () => {
      const w = mountTitle()
      await w.get('.lq-title-page').trigger('pointerdown')
      expect(w.get('.lq-title-page').classes()).toContain('is-open')
      await w.get('button').trigger('pointerdown')
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

  it('starts with the Start button', async () => {
    const w = mountTitle()
    await flushPromises()
    expect(document.activeElement?.textContent?.trim()).toBe('Start')

    await w.get('button').trigger('click')

    expect(w.emitted('start')).toHaveLength(1)
  })

  describe('with saves', () => {
    /** Each button's text as a screen reader names it: without what is hidden from it. */
    const labels = (w: VueWrapper): string[] =>
      w.findAll('button').map((b) => {
        const copy = b.element.cloneNode(true) as HTMLElement
        for (const hidden of copy.querySelectorAll('[aria-hidden="true"]'))
          hidden.remove()
        return (copy.textContent ?? '').trim()
      })

    it('offers only Start when there are no saves, and Escape does nothing', async () => {
      const w = mountTitle()
      expect(labels(w)).toEqual(['Start'])
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toBeUndefined()
    })

    it('treats empty slots as no saves', () => {
      const w = mountTitle([save(1, { room: null })])
      expect(labels(w)).toEqual(['Start'])
    })

    it('offers a Continue card naming the save, then New game and Load game', async () => {
      const w = mountTitle([save(2)])
      await flushPromises()
      const [cont] = w.findAll('button')
      expect(cont.classes()).toContain('lq-title-continue')
      expect(cont.get('.lq-continue-kicker').text()).toBe('Continue')
      expect(cont.get('.lq-continue-title').text()).toBe('The Old Mill')
      expect(cont.get('.lq-continue-line').text()).toBe(
        'Act II · 3 Nov · 21:14',
      )
      expect(cont.get('.lq-continue-play').attributes('aria-hidden')).toBe(
        'true',
      )
      expect(labels(w)[0]).toMatch(/^Continue\s*The Old Mill\s*Act II · /)
      expect(cont.attributes('aria-label')).toBe(
        'Continue, The Old Mill, Act II · 3 Nov · 21:14',
      )
      expect(labels(w).slice(1)).toEqual(['New game', 'Load game'])
      expect(document.activeElement).toBe(cont.element)
    })

    it('treats a player with only named saves as returning, and names the save on the Continue card', () => {
      const w = mountTitle([
        save(-1, { name: 'oldrun', act: null, room: null }),
      ])
      expect(labels(w)[0]).toMatch(/^Continue\s*oldrun\s*3 Nov · 21:14$/)
      expect(labels(w).slice(1)).toEqual(['New game', 'Load game'])
    })

    it('puts every choice in the one glass dock, New game and Load game marked by an icon', () => {
      const w = mountTitle([save(2)])
      const dock = w.get('.lq-title-buttons')
      expect(dock.classes()).toContain('lq-title-dock')
      expect(dock.findAll('button')).toHaveLength(3)
      for (const button of w.findAll('.lq-title-second'))
        expect(button.get('.lq-title-icon').attributes('aria-hidden')).toBe(
          'true',
        )
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
      expect(w.get('.lq-title-dock').classes()).toContain('is-pair')
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
