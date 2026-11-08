// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import TitlePage from './TitlePage.vue'
import type { SaveSlot } from '@/types/bridge'

const LOGO =
  'Welcome to\n[bold yellow]\n#####\n##  ##\n[/bold yellow]\n' +
  '[bold]Music track:[/bold] Market by Conquest\nSource: https://freetouse.com/music'

describe('TitlePage', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountTitle(
    musicInfo?: string,
    saves: SaveSlot[] = [],
    error = '',
  ): VueWrapper {
    wrapper = mount(TitlePage, {
      props: { text: LOGO, musicInfo, saves, error },
      attachTo: document.body,
    })
    return wrapper
  }

  it('is a page named RetroQuest with the art hidden from screen readers', () => {
    const w = mountTitle()
    const dialog = w.get('[role="dialog"]')

    expect(dialog.get(`#${dialog.attributes('aria-labelledby')}`).text()).toBe(
      'RetroQuest',
    )
    expect(w.get('pre').attributes('aria-hidden')).toBe('true')
    expect(w.get('pre').text()).toContain('#####')
  })

  it('names the music with a link to its source', () => {
    const w = mountTitle()

    expect(w.get('.lq-credits').text()).toContain('Market by Conquest')
    expect(w.get('.lq-credits a').attributes('href')).toBe(
      'https://freetouse.com/music',
    )
  })

  it('credits the music playing, when the player gives its credit', () => {
    const w = mountTitle(
      'Original music for RetroQuest\n' +
        'Images, narration and music made with Content Studio',
    )

    const lines = w.findAll('.lq-credits span:not(.lq-credits-label)')
    expect(lines.map((l) => l.text())).toEqual([
      'Original music for RetroQuest',
      'Images, narration and music made with Content Studio',
    ])
    expect(w.get('.lq-credits').text()).not.toContain('Conquest')
    expect(w.find('.lq-credits a').exists()).toBe(false)
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
    const NOW = '2026-11-03T21:14:00'
    const save = (slot: number, over: Partial<SaveSlot> = {}): SaveSlot => ({
      slot,
      act: 'Act 2',
      room: 'The Old Mill',
      timestamp: NOW,
      quests: null,
      ...over,
    })
    const labels = (w: VueWrapper): string[] =>
      w.findAll('button').map((b) => b.text())

    it('offers only Start when there are no saves, and Escape starts', async () => {
      const w = mountTitle()
      expect(labels(w)).toEqual(['Start'])
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toHaveLength(1)
    })

    it('treats empty slots as no saves', () => {
      const w = mountTitle('', [save(1, { room: null })])
      expect(labels(w)).toEqual(['Start'])
    })

    it('offers Continue, New game and Load game, with Continue naming the save', async () => {
      const w = mountTitle('', [save(2)])
      await flushPromises()
      expect(
        w.findAll('button').map((b) => b.find('.lq-title-line').exists()),
      ).toEqual([true, false, false])
      expect(labels(w)[0]).toMatch(/^Continue\s*Act II · The Old Mill · /)
      expect(labels(w).slice(1)).toEqual(['New game', 'Load game'])
      expect(document.activeElement).toBe(w.findAll('button')[0].element)
    })

    it('treats a player with only named saves as returning, and names the save under Continue', () => {
      const w = mountTitle('', [
        save(-1, { name: 'oldrun', act: null, room: null }),
      ])
      expect(labels(w)[0]).toMatch(/^Continue\s*oldrun · 3 Nov · 21:14$/)
      expect(labels(w).slice(1)).toEqual(['New game', 'Load game'])
    })

    it('keeps Escape inert while saves exist', async () => {
      const w = mountTitle('', [save(2)])
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toBeUndefined()
    })

    it('emits continue, start and load from the three buttons', async () => {
      const w = mountTitle('', [save(2)])
      const [cont, fresh, load] = w.findAll('button')
      await cont.trigger('click')
      await fresh.trigger('click')
      await load.trigger('click')
      expect(w.emitted('continue')).toHaveLength(1)
      expect(w.emitted('start')).toHaveLength(1)
      expect(w.emitted('load')).toHaveLength(1)
    })

    it('has no Continue when every save is old: New game is main and focused', async () => {
      const w = mountTitle('', [save(1, { outdated: true })])
      await flushPromises()
      expect(labels(w)).toEqual(['New game', 'Load game'])
      expect(w.findAll('button')[0].classes()).toContain('lq-title-start')
      expect(document.activeElement).toBe(w.findAll('button')[0].element)
      await w.get('section').trigger('keydown', { key: 'Escape' })
      expect(w.emitted('start')).toBeUndefined()
    })

    it('shows why a load failed', () => {
      const w = mountTitle('', [save(2)], 'No save file found.')
      expect(w.get('[role="alert"]').text()).toBe('No save file found.')
    })
  })
})
