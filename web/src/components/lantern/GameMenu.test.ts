// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameMenu, { type MenuEntry } from './GameMenu.vue'
import { useGameStore } from '@/stores/useGameStore'

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

  function mountMenu(props: { focus?: MenuEntry } = {}) {
    wrapper = mount(GameMenu, { attachTo: document.body, props })
    return wrapper
  }

  function item(w: VueWrapper, label: string) {
    const found = w.findAll('button').find((b) => b.text().startsWith(label))
    if (!found) throw new Error(`No ${label}`)
    return found
  }

  const key = (target: Element, name: string): void => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: name,
        bubbles: true,
        cancelable: true,
      }),
    )
  }

  it('is a pause panel: "Paused", then the heading "Menu"', () => {
    const w = mountMenu()

    expect(w.get('[role="dialog"] h2').text()).toBe('Menu')
    expect(w.get('.lq-dialog-eyebrow').text()).toBe('Paused')
    expect(w.get('.lq-dialog-layer').classes()).toContain('lq-dialog-centered')
  })

  it('is a pane of frosted glass, like the title page', () => {
    const w = mountMenu()

    expect(w.get('.lq-dialog-layer').classes()).toContain('lq-dialog-glass')
    expect(w.get('.lq-dialog-layer').classes()).toContain('lq-dialog-narrow')
  })

  it('gives every entry a quiet icon, and each window it opens an arrow', () => {
    const w = mountMenu()
    const entries = w.findAll('.lq-menu-entry')

    for (const entry of entries) {
      expect(entry.get('.lq-menu-icon').attributes('aria-hidden')).toBe('true')
    }
    const arrowed = entries
      .filter((entry) => entry.find('.lq-menu-arrow').exists())
      .map((entry) => entry.text())
    expect(arrowed).toEqual(['Save', 'Load', 'Settings', 'Help'])
    for (const arrow of w.findAll('.lq-menu-arrow')) {
      expect(arrow.attributes('aria-hidden')).toBe('true')
    }
  })

  it('lists plain one-word entries in the agreed order', () => {
    const w = mountMenu()

    const labels = w.findAll('.lq-menu-entry').map((entry) => entry.text())
    expect(labels).toEqual([
      'Quick save',
      'Quick load',
      'Save',
      'Load',
      'Settings',
      'Help',
      'Quit',
    ])
    expect(w.text()).not.toContain('Stats')
  })

  it('starts focus on Save, or on the entry it is given back to', async () => {
    mountMenu()
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent?.trim()).toBe('Save'),
    )
    wrapper?.unmount()
    mountMenu({ focus: 'settings' })
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent?.trim()).toBe('Settings'),
    )
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

  it('opens Save, Load, Settings and Help, and asks to quit', async () => {
    const w = mountMenu()

    await item(w, 'Save').trigger('click')
    await item(w, 'Load').trigger('click')
    await item(w, 'Settings').trigger('click')
    await item(w, 'Help').trigger('click')
    await item(w, 'Quit').trigger('click')

    expect(w.emitted('open')).toEqual([
      ['save'],
      ['load'],
      ['settings'],
      ['help'],
    ])
    expect(w.emitted('quit')).toHaveLength(1)
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
    expect(w.get('.lq-note').text()).toBe(
      'The quick save is from an older version',
    )
    await quickLoad.trigger('click')
    expect(load).not.toHaveBeenCalled()
  })

  it('has no note under Quick load otherwise', () => {
    const w = mountMenu()

    expect(item(w, 'Quick load').attributes()).not.toHaveProperty('disabled')
    expect(w.find('.lq-note').exists()).toBe(false)
  })

  it('moves between entries with the arrow keys, around the ends, skipping a dimmed one', async () => {
    const game = useGameStore()
    vi.mocked(game.getQuickSave).mockReturnValue({
      slot: 0,
      act: 'Act 3',
      room: null,
      timestamp: null,
      quests: null,
      outdated: true,
    })
    const w = mountMenu()
    const focused = (): string | undefined =>
      document.activeElement?.textContent?.trim()
    await vi.waitFor(() => expect(focused()).toBe('Save'))

    key(document.activeElement!, 'ArrowDown')
    expect(focused()).toBe('Load')
    key(document.activeElement!, 'ArrowUp')
    key(document.activeElement!, 'ArrowUp')
    // Quick load is dimmed and passed over.
    expect(focused()).toBe('Quick save')
    key(document.activeElement!, 'ArrowUp')
    expect(focused()).toBe('Quit')
    key(document.activeElement!, 'ArrowDown')
    expect(focused()).toBe('Quick save')
    expect(w.emitted('open')).toBeUndefined()
  })

  it('chooses the focused entry with Enter', async () => {
    const w = mountMenu()
    await vi.waitFor(() =>
      expect(document.activeElement?.textContent?.trim()).toBe('Save'),
    )

    await (document.activeElement as HTMLElement).click()

    expect(w.emitted('open')).toEqual([['save']])
  })

  it('puts the ring on an entry a moving pointer is over, and leaves it for a resting one', async () => {
    const w = mountMenu()
    await w.vm.$nextTick()
    const quit = item(w, 'Quit')

    await quit.trigger('mousemove', { screenX: 1 })
    expect(document.activeElement).toBe(item(w, 'Save').element)
    await quit.trigger('mousemove', { screenX: 9 })
    expect(document.activeElement).toBe(quit.element)
  })

  it("marks every entry as a ring stop, for the menus' one ring", () => {
    const w = mountMenu()
    const entries = w.findAll('.lq-menu-entry')

    expect(entries).toHaveLength(7)
    for (const entry of entries) {
      expect(entry.attributes('data-ring')).toBeDefined()
    }
  })

  it('closes with its close button', async () => {
    const w = mountMenu()

    await w.get('button[aria-label="Close"]').trigger('click')

    expect(w.emitted('close')).toHaveLength(1)
  })
})
