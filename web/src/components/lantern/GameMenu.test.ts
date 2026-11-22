// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameMenu, { type MenuEntry } from './GameMenu.vue'
import { useGameStore } from '@/stores/useGameStore'
import type { QuestSummary } from '@/engine'

const sounds = vi.hoisted(() => ({ move: vi.fn(), choose: vi.fn() }))
vi.mock('@/composables/useUiSounds', () => ({
  useUiSounds: () => ({ playMove: sounds.move, playChoose: sounds.choose }),
}))

describe('GameMenu', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(useGameStore(), 'getQuickSave').mockReturnValue(null)
    vi.spyOn(useGameStore(), 'saveGame').mockReturnValue(true)
    vi.spyOn(useGameStore(), 'loadGame').mockImplementation(() => {})
    sounds.move.mockClear()
    sounds.choose.mockClear()
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

  describe('clicks', () => {
    it('opens silent, ticks when the ring moves, and latches on a choice', () => {
      const w = mountMenu()
      const save = item(w, 'Save').element as HTMLElement
      save.focus()
      expect(sounds.move).not.toHaveBeenCalled()
      key(save, 'ArrowDown')
      expect(sounds.move).toHaveBeenCalledTimes(1)
      expect(sounds.choose).not.toHaveBeenCalled()
    })

    it('latches once for every entry chosen', async () => {
      const w = mountMenu()
      const labels = [
        'Quick save',
        'Quick load',
        'Save',
        'Load',
        'Settings',
        'Help',
        'Send feedback',
        'Quit',
      ]
      for (const label of labels) await item(w, label).trigger('click')
      for (const tile of w.findAll('.lq-menu-journey'))
        await tile.trigger('click')
      expect(sounds.choose).toHaveBeenCalledTimes(labels.length + 3)
    })

    it('ticks when Tab or the pointer moves the ring to another entry', async () => {
      const w = mountMenu()
      const first = item(w, 'Save').element as HTMLElement
      first.focus()
      const other = item(w, 'Load').element as HTMLElement
      first.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, screenX: 1, screenY: 1 }),
      )
      other.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, screenX: 9, screenY: 9 }),
      )
      expect(document.activeElement).toBe(other)
      expect(sounds.move).toHaveBeenCalledTimes(1)
      item(w, 'Help').element.focus()
      expect(sounds.move).toHaveBeenCalledTimes(2)
    })

    it('is silent when the menu is closed with Esc, ✕ or the dimmed game', async () => {
      const w = mountMenu()
      await w.get('.lq-dialog-layer').trigger('keydown', { key: 'Escape' })
      await w.get('.lq-dialog-close').trigger('click')
      await w.get('.lq-dialog-scrim').trigger('click')
      expect(sounds.choose).not.toHaveBeenCalled()
      expect(sounds.move).not.toHaveBeenCalled()
    })
  })

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

  it('lists plain one-word entries in the agreed order, the journey first', () => {
    const w = mountMenu()

    const labels = w
      .findAll('.lq-menu-entry')
      .map((entry) => entry.attributes('aria-label') ?? entry.text())
    expect(labels).toEqual([
      'Journal',
      'Quests',
      'Map',
      'Quick save',
      'Quick load',
      'Save',
      'Load',
      'Settings',
      'Help',
      'Send feedback',
      'Quit',
    ])
    expect(w.text()).not.toContain('Stats')
  })

  describe('the journey tiles', () => {
    it('shows Journal, Quests and Map as tiles, each with its key', () => {
      const w = mountMenu()
      const tiles = w.findAll('.lq-menu-journey')

      expect(tiles.map((t) => t.get('.lq-menu-journey-name').text())).toEqual([
        'Journal',
        'Quests',
        'Map',
      ])
      expect(tiles.map((t) => t.get('kbd').text())).toEqual(['J', 'Q', 'M'])
      for (const tile of tiles)
        expect(tile.get('kbd').attributes('aria-hidden')).toBe('true')
    })

    it('counts the open quests on the Quests tile, and marks news', () => {
      const game = useGameStore()
      const quest = (name: string): QuestSummary => ({
        name,
        main: false,
        done: false,
        details: { kind: 'journal', earlier: [], latest: '' },
      })
      game.activeQuests = [quest('One'), quest('Two')]
      game.questsHaveNew = true
      const w = mountMenu()
      const quests = w.findAll('.lq-menu-journey')[1]

      expect(quests.get('.lq-menu-journey-count').text()).toBe('2')
      expect(quests.find('.lq-menu-journey-new').exists()).toBe(true)
      expect(quests.attributes('aria-label')).toBe('Quests')
      const note = document.getElementById(
        quests.attributes('aria-describedby') ?? '',
      )
      expect(note?.textContent).toBe('2 open, news')
      expect(note?.classList).toContain('lq-sr-only')
    })

    it("names each tile's key for assistive technology", () => {
      const w = mountMenu()
      expect(
        w
          .findAll('.lq-menu-journey')
          .map((t) => t.attributes('aria-keyshortcuts')),
      ).toEqual(['J', 'Q', 'M'])
    })

    it('opens the journal, the quests and the map', async () => {
      const w = mountMenu()
      for (const label of ['Journal', 'Quests', 'Map'])
        await w.get(`[aria-label="${label}"]`).trigger('click')

      expect(w.emitted('open')).toEqual([['journal'], ['quests'], ['map']])
    })

    it('starts focus on the tile it is given back to', async () => {
      mountMenu({ focus: 'quests' })
      await vi.waitFor(() =>
        expect(document.activeElement?.getAttribute('aria-label')).toBe(
          'Quests',
        ),
      )
    })
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
      document.activeElement?.getAttribute('aria-label') ??
      document.activeElement?.textContent?.trim()
    await vi.waitFor(() => expect(focused()).toBe('Save'))

    key(document.activeElement!, 'ArrowDown')
    expect(focused()).toBe('Load')
    key(document.activeElement!, 'ArrowUp')
    key(document.activeElement!, 'ArrowUp')
    // Quick load is dimmed and passed over.
    expect(focused()).toBe('Quick save')
    key(document.activeElement!, 'ArrowUp')
    expect(focused()).toBe('Map')
    key(document.activeElement!, 'ArrowUp')
    key(document.activeElement!, 'ArrowUp')
    expect(focused()).toBe('Journal')
    key(document.activeElement!, 'ArrowUp')
    expect(focused()).toBe('Quit')
    key(document.activeElement!, 'ArrowDown')
    expect(focused()).toBe('Journal')
    expect(w.emitted('open')).toBeUndefined()
  })

  it('has Send feedback between Help and Quit, with the key hint F2, and opens it', async () => {
    const w = mountMenu()
    const row = item(w, 'Send feedback')
    expect(row.get('.lq-menu-row-key').text()).toBe('F2')
    expect(row.attributes('aria-keyshortcuts')).toBe('F2')
    await row.trigger('click')
    expect(w.emitted('open')).toEqual([['feedback']])
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

    expect(entries).toHaveLength(10)
    for (const entry of entries) {
      expect(entry.attributes('data-ring')).toBeDefined()
    }
  })

  it('carries the key line at its foot, as the windows it opens do', () => {
    const w = mountMenu()
    const hints = w.getComponent({ name: 'KeyLine' }).props('hints')
    expect(hints).toEqual([
      { keys: ['↑', '↓'], word: 'move' },
      { keys: ['Enter'], word: 'choose' },
      { keys: ['Esc'], word: 'back' },
    ])
  })

  it('closes with its close button', async () => {
    const w = mountMenu()

    await w.get('button[aria-label="Close"]').trigger('click')

    expect(w.emitted('close')).toHaveLength(1)
  })
})
