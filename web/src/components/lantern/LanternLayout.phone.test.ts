// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { startedHoldStore } from '@/testing/holdGame'
import { useGameStore } from '@/stores/useGameStore'

/**
 * Which screen the test pretends to be: `upright` is a tablet (or a narrow mouse
 * window), which keeps the tall stage; `turn` a phone held upright; `sideways` a
 * phone on its side.
 */
function screen(kind: 'upright' | 'turn' | 'sideways'): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        kind !== 'upright' &&
        (query.includes('hover: none') ||
          (kind === 'turn' && query.includes('orientation: portrait'))),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

/** The stage on a phone (under 1024 wide, not short), over the real engine. */
describe('LanternLayout: the stage on a phone', () => {
  let w: VueWrapper

  async function mountOn(kind: 'upright' | 'turn' | 'sideways'): Promise<void> {
    setActivePinia(createPinia())
    screen(kind)
    await startedHoldStore()
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
  }
  afterEach(() => {
    w.unmount()
    vi.unstubAllGlobals()
  })

  describe('upright', () => {
    beforeEach(() => mountOn('upright'))

    it('plays the room on its picture, with the plate and a folded bar', () => {
      expect(w.find('.lq-stage-picture').exists()).toBe(true)
      expect(w.get('.lq-plate h2').text()).toBe(useGameStore().roomName)
      expect(w.get('.lq-plate').text()).not.toContain('You are in')
      expect(w.find('.lq-dock').exists()).toBe(true)
      expect(w.get('.lq-sheet').isVisible()).toBe(false)
    })

    it('keeps the five section tabs and no buttons on the picture', () => {
      expect(w.findAll('.lq-nav-bottom .lq-nav-btn')).toHaveLength(5)
      expect(w.find('.lq-buttons').exists()).toBe(false)
    })

    it('leaves the room name to the plate', () => {
      expect(w.find('.lq-compact-room').exists()).toBe(false)
    })

    it('opens the story so far over the stage and closes it with ✕', async () => {
      await w.get('.lq-story-so-far').trigger('click')
      expect(w.find('.lq-story-drawer').exists()).toBe(true)
      expect(w.get('.lq-story-drawer').classes()).toContain('lq-phone-drawer')
      await w.get('.lq-story-drawer .lq-drawer-close').trigger('click')
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
    })

    it('closes the story so far with the Story tab, and when another tab is visited', async () => {
      await w.get('.lq-story-so-far').trigger('click')
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[0]!.trigger('click')
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
      await w.get('.lq-story-so-far').trigger('click')
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[1]!.trigger('click')
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[0]!.trigger('click')
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
    })

    it('opens the sheet over the picture from the bar, covering the words', async () => {
      await w.get('.lq-dock-open').trigger('click')
      expect(w.find('.lq-sheet').exists()).toBe(true)
      expect(w.get('.lq-sheet').isVisible()).toBe(true)
      expect(w.find('.lq-scrim').exists()).toBe(true)
      expect(w.find('.lq-dock').exists()).toBe(false)
      expect(w.get('.lq-story-wrap').classes()).toContain('lq-covered')
      expect(w.find('.lq-speech-zone').exists()).toBe(false)
    })

    it('folds the sheet after a turn, so the answer is read on the picture', async () => {
      await w.get('.lq-dock-open').trigger('click')
      useGameStore().submitCommand('look')
      await flushPromises()
      await flushPromises()
      expect(w.find('.lq-scrim').exists()).toBe(false)
      expect(w.find('.lq-dock').exists()).toBe(true)
    })

    it('moves focus into the story so far and back to its button on ✕', async () => {
      await w.get('.lq-story-so-far').trigger('click')
      await flushPromises()
      expect(
        w.get('.lq-story-drawer').element.contains(document.activeElement),
      ).toBe(true)
      await w.get('.lq-story-drawer .lq-drawer-close').trigger('click')
      await flushPromises()
      expect(document.activeElement).toBe(w.get('.lq-story-so-far').element)
    })

    it('puts the story so far away when a quest is opened in the journal', async () => {
      await w.get('.lq-story-so-far').trigger('click')
      useGameStore().questToOpen = 'First'
      await flushPromises()
      expect(w.find('.lq-story-drawer').exists()).toBe(false)
    })

    it('has "⟲ Story so far" as the only button on the plate: no one and nothing is listed', () => {
      const buttons = w.get('.lq-plate').findAll('button')
      expect(buttons.map((b) => b.text())).toEqual(['⟲ Story so far'])
    })

    it('keeps the stage as it was left when another tab is visited', async () => {
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[1]!.trigger('click')
      expect(w.get('.lq-stage').isVisible()).toBe(false)
      await w.findAll('.lq-nav-bottom .lq-nav-btn')[0]!.trigger('click')
      expect(w.get('.lq-stage').isVisible()).toBe(true)
    })
  })

  describe('a phone held upright', () => {
    beforeEach(() => mountOn('turn'))

    it('shows the turn page and nothing of the game can be reached behind it', () => {
      expect(w.find('.lq-turn-page').exists()).toBe(true)
      expect(w.get('.lq-game').attributes('inert')).toBeDefined()
    })

    it('has no tablet layout: a tablet held upright gets no turn page', async () => {
      w.unmount()
      await mountOn('upright')
      expect(w.find('.lq-turn-page').exists()).toBe(false)
      expect(w.get('.lq-game').attributes('inert')).toBeUndefined()
    })
  })

  describe('a phone on its side', () => {
    beforeEach(() => mountOn('sideways'))

    it('fills the screen with the picture, with no header, tabs or room box', () => {
      expect(w.find('.lq-turn-page').exists()).toBe(false)
      expect(w.find('.lq-stage-picture').exists()).toBe(true)
      expect(w.find('.lq-header').exists()).toBe(false)
      expect(w.find('.lq-nav-bottom').exists()).toBe(false)
      expect(w.find('.lq-phone-plate').exists()).toBe(false)
    })

    it('floats ☰ and one plate top left, the three buttons top right', () => {
      expect(w.get('.lq-float-menu').attributes('aria-label')).toBe('Game menu')
      expect(w.get('.lq-stage-plate').classes()).toContain('lq-plate-compact')
      const labels = w
        .findAll('.lq-stage-buttons .lq-stage-btn')
        .map((b) => b.text().replace(/\s+/g, ' '))
      expect(labels).toEqual([
        expect.stringMatching(/^Quests · \d+$/),
        '⟲',
        '🧭',
      ])
    })

    it('has the folded bar at the foot left: Actions, the keyboard and the hint', () => {
      const dock = w.get('.lq-dock')
      expect(dock.classes()).toContain('lq-floating')
      expect(dock.find('.lq-dock-exits').exists()).toBe(false)
      expect(dock.get('.lq-dock-open').text()).toBe('Actions ▴')
      expect(dock.get('.lq-dock-icon').attributes('aria-label')).toBe(
        'Type a command',
      )
      expect(dock.get('.lq-dock-hint').text()).toBe('💡 Hint')
    })

    it('opens the menu from ☰ as the sideways list', async () => {
      vi.spyOn(useGameStore(), 'getQuickSave').mockReturnValue(null)
      await w.get('.lq-float-menu').trigger('click')
      await flushPromises()
      expect(document.body.querySelector('.lq-side-list')).not.toBeNull()
    })

    it('opens the sheet over the picture and folds it after a turn', async () => {
      await w.get('.lq-dock-open').trigger('click')
      expect(w.get('.lq-sheet').isVisible()).toBe(true)
      useGameStore().submitCommand('look')
      await flushPromises()
      await flushPromises()
      expect(w.find('.lq-scrim').exists()).toBe(false)
      expect(w.find('.lq-dock').exists()).toBe(true)
    })
  })

  it('keeps the game as it was when a phone is turned upright and back', async () => {
    setActivePinia(createPinia())
    const state = { portrait: false }
    const listeners: ((event: { matches: boolean }) => void)[] = []
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        get matches() {
          return (
            query.includes('hover: none') ||
            (state.portrait && query.includes('orientation: portrait'))
          )
        },
        addEventListener: vi.fn((_type: string, listener: never) => {
          if (query.includes('orientation')) listeners.push(listener)
        }),
        removeEventListener: vi.fn(),
      })),
    )
    await startedHoldStore()
    w = mount(LanternLayout, { attachTo: document.body })
    await w.get('.lq-dock-open').trigger('click')
    const sheetBefore = w.find('.lq-sheet').exists()
    await w.get('[data-button="story"]').trigger('click')
    expect(w.find('.lq-story-drawer').exists()).toBe(true)

    state.portrait = true
    listeners.forEach((change) => change({ matches: true }))
    await flushPromises()
    expect(w.find('.lq-turn-page').exists()).toBe(true)
    expect(w.find('.lq-story-drawer').exists()).toBe(true)

    state.portrait = false
    listeners.forEach((change) => change({ matches: false }))
    await flushPromises()
    expect(w.find('.lq-turn-page').exists()).toBe(false)
    expect(w.find('.lq-sheet').exists()).toBe(sheetBefore)
    expect(w.find('.lq-story-drawer').exists()).toBe(true)
    expect(w.find('.lq-header').exists()).toBe(false)
    expect(w.find('.lq-stage-picture').exists()).toBe(true)
  })
})
