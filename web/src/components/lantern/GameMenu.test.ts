// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameMenu from './GameMenu.vue'
import { startedHoldStore } from '@/testing/holdGame'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

describe('GameMenu', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(useGameStore(), 'getQuickSave').mockReturnValue(null)
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountMenu() {
    wrapper = mount(GameMenu, { attachTo: document.body })
    return wrapper
  }

  function item(w: VueWrapper, label: string) {
    const found = w.findAll('button').find((b) => b.text().startsWith(label))
    if (!found) throw new Error(`No ${label}`)
    return found
  }

  it('is the game menu dialog', () => {
    const w = mountMenu()

    expect(w.get('[role="dialog"] h2').text()).toBe('Game')
  })

  it('saves and loads quickly, then closes', async () => {
    const game = useGameStore()
    const save = vi.spyOn(game, 'saveGame').mockImplementation(() => true)
    const load = vi.spyOn(game, 'loadGame').mockImplementation(() => {})
    const w = mountMenu()

    await item(w, 'Quick save').trigger('click')
    await item(w, 'Quick load').trigger('click')

    expect(save).toHaveBeenCalledOnce()
    expect(load).toHaveBeenCalledOnce()
    expect(w.emitted('close')).toHaveLength(2)
  })

  it('opens Save, Load, Stats, Settings and Help', async () => {
    const w = mountMenu()

    await item(w, 'Save game').trigger('click')
    await item(w, 'Load game').trigger('click')
    await item(w, 'Stats').trigger('click')
    await item(w, 'Settings').trigger('click')
    await item(w, 'Help').trigger('click')

    expect(w.emitted('open')).toEqual([
      ['save'],
      ['load'],
      ['stats'],
      ['settings'],
      ['help'],
    ])
  })

  it('dims Quick load, and says why, when the quick save is from an older version', async () => {
    const game = useGameStore()
    vi.mocked(game.getQuickSave).mockReturnValue({
      slot: 0,
      act: 'Act 3',
      room: null,
      timestamp: null,
      quests: null,
      outdated: true,
    })
    const load = vi.spyOn(game, 'loadGame').mockImplementation(() => {})
    const w = mountMenu()
    const quickLoad = item(w, 'Quick load')

    expect(quickLoad.attributes()).toHaveProperty('disabled')
    expect(quickLoad.get('.lq-note').text()).toBe(
      'The quick save is from an older version',
    )
    await quickLoad.trigger('click')
    expect(load).not.toHaveBeenCalled()
  })

  it('leaves Quick load as it is otherwise', () => {
    const quickLoad = item(mountMenu(), 'Quick load')

    expect(quickLoad.attributes()).not.toHaveProperty('disabled')
    expect(quickLoad.get('.lq-note').text()).toBe('Back to the quick save')
  })

  it('closes with its close button', async () => {
    const w = mountMenu()

    await w.get('button[aria-label="Close"]').trigger('click')

    expect(w.emitted('close')).toHaveLength(1)
  })
  describe('sideways (a phone on its side)', () => {
    function mountSideways() {
      wrapper = mount(GameMenu, {
        attachTo: document.body,
        props: { sideways: true },
      })
      return wrapper
    }

    it('lists the agreed rows in the agreed order', () => {
      const w = mountSideways()
      const labels = w
        .findAll('.lq-side-row .lq-side-label')
        .map((row) => row.text())
      expect(labels).toEqual([
        'Quick save',
        'Quick load',
        'Save',
        'Load',
        'Stats',
        'Settings',
        'Help',
        'Text size',
        'Theme',
        ...(document.fullscreenEnabled ? ['Full screen'] : []),
      ])
    })

    it('opens with the act and the quest count on one row', async () => {
      await startedHoldStore()
      const w = mountSideways()
      expect(w.get('.lq-side-act').text()).toMatch(/^Act I.*Quests \d+\/\d+$/s)
    })

    it('opens Save and Load from its rows', async () => {
      const w = mountSideways()
      const row = w
        .findAll('.lq-side-row')
        .find((r) => r.text().startsWith('Save'))!
      await row.trigger('click')
      expect(w.emitted('open')).toEqual([['save']])
    })

    it('sets the text size and switches the theme', async () => {
      const w = mountSideways()
      const settings = useSettingsStore()
      await w.get('[aria-label="Smallest text"]').trigger('click')
      expect(settings.textSize).toBe('smallest')
      settings.theme = 'dark'
      await w.get('[data-row="theme"]').trigger('click')
      expect(settings.theme).toBe('light')
    })
  })
})
