// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import JournalPanel from './JournalPanel.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('JournalPanel', () => {
  let wrapper: VueWrapper | undefined
  let submit: ReturnType<typeof vi.fn<(command: string) => void>>
  let markSeen: ReturnType<
    typeof vi.fn<(tab: 'bag' | 'spells' | 'quests') => void>
  >

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    game.rawInventory = [
      { name: '[item_name]bread[/item_name]', description: 'A small loaf.' },
      { name: '[item_name]2 apple[/item_name]', description: 'Crisp.' },
    ]
    game.rawSpells = [
      {
        name: '[spell_name]revive[/spell_name]',
        description: 'Restores life.',
      },
    ]
    game.rawActiveQuests = [
      {
        name: '[quest_name]Shadows Over Willowbrook (main)[/quest_name]',
        description:
          'Elior dreams of a [character_name]shadowy figure[/character_name].',
      },
      {
        name: '[quest_name]Know your village (side)[/quest_name]',
        description: 'Explore Willowbrook.',
      },
    ]
    game.rawCompletedQuests = [
      {
        name: '[quest_name]Hint of Magic (side)[/quest_name]',
        description: 'Done.',
      },
    ]
    submit = vi.fn<(command: string) => void>()
    markSeen = vi.fn<(tab: 'bag' | 'spells' | 'quests') => void>()
    vi.spyOn(game, 'submitCommand').mockImplementation(submit)
    vi.spyOn(game, 'markSeen').mockImplementation(markSeen)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountJournal() {
    wrapper = mount(JournalPanel)
    return wrapper
  }

  function rowToggle(w: VueWrapper, name: string) {
    const found = w
      .findAll('button[aria-expanded]')
      .find((b) => b.get('.lq-row-name').text().startsWith(name))
    if (!found) throw new Error(`No row toggle for ${name}`)
    return found
  }

  function tab(w: VueWrapper, name: RegExp) {
    const found = w.findAll('[role="tab"]').find((t) => name.test(t.text()))
    if (!found) throw new Error(`No tab ${name}`)
    return found
  }

  it('shows Bag, Spells and Quests tabs with counts', () => {
    const tabs = mountJournal()
      .findAll('[role="tab"]')
      .map((t) => t.text())

    expect(tabs).toEqual(['Bag · 2', 'Spells · 1', 'Quests · 2 active'])
  })

  it('opens on the bag with display names and stack counts', () => {
    const w = mountJournal()

    expect(tab(w, /Bag/).attributes('aria-selected')).toBe('true')
    const names = w.findAll('.lq-row-name').map((n) => n.text())
    expect(names).toEqual(['Bread', 'Apple ×2'])
    expect(w.text()).toContain('A small loaf.')
  })

  it('uses a bag item from its row', async () => {
    const w = mountJournal()

    await w.get('button[aria-label="Use Apple"]').trigger('click')

    expect(submit).toHaveBeenCalledWith('use apple')
  })

  it('casts a spell from its row', async () => {
    const w = mountJournal()
    await tab(w, /Spells/).trigger('click')

    await w.get('button[aria-label="Cast Revive"]').trigger('click')

    expect(submit).toHaveBeenCalledWith('cast revive')
  })

  it('shows a dot on a tab with something new and clears it when opened', async () => {
    const game = useGameStore()
    game.spellsHaveNew = true
    const w = mountJournal()
    expect(
      tab(w, /Spells/)
        .find('.lq-dot')
        .exists(),
    ).toBe(true)

    await tab(w, /Spells/).trigger('click')

    expect(markSeen).toHaveBeenCalledWith('spells')
  })

  it('marks the open tab seen when something new arrives in it', async () => {
    const w = mountJournal()

    useGameStore().bagHasNew = true
    await w.vm.$nextTick()

    expect(markSeen).toHaveBeenCalledWith('bag')
  })

  it('lists active quests with the main quest marked, then done ones', async () => {
    const w = mountJournal()
    await tab(w, /Quests/).trigger('click')

    const names = w.findAll('.lq-quest-name').map((n) => n.text())
    expect(names).toEqual([
      'Shadows Over Willowbrook',
      'Know your village',
      'Hint of Magic',
    ])
    expect(w.findAll('.lq-badge-main')).toHaveLength(1)
    expect(w.findAll('.lq-badge-done')).toHaveLength(1)
  })

  it('expands a quest to show its description', async () => {
    const w = mountJournal()
    await tab(w, /Quests/).trigger('click')
    const toggle = w.findAll('.lq-quest-toggle')[0]
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(w.find('.lq-quest-details .theme-character_name').text()).toBe(
      'shadowy figure',
    )
  })

  it('disables the row actions while the game is not accepting input', () => {
    useGameStore().acceptInput = false
    const w = mountJournal()

    expect(w.get('button[aria-label="Use Bread"]').attributes()).toHaveProperty(
      'disabled',
    )
  })

  it('keeps only the selected tab in the tab order (roving tabindex)', async () => {
    const w = mountJournal()
    const tabIndexes = () =>
      w.findAll('[role="tab"]').map((t) => t.attributes('tabindex'))
    expect(tabIndexes()).toEqual(['0', '-1', '-1'])

    await tab(w, /Quests/).trigger('click')

    expect(tabIndexes()).toEqual(['-1', '-1', '0'])
  })

  it('moves between tabs with the arrow, Home and End keys', async () => {
    wrapper = mount(JournalPanel, { attachTo: document.body })
    const w = wrapper
    const selected = () =>
      w
        .findAll('[role="tab"]')
        .find((t) => t.attributes('aria-selected') === 'true')

    await tab(w, /Bag/).trigger('keydown', { key: 'ArrowRight' })
    expect(selected()?.text()).toMatch(/^Spells/)
    expect(document.activeElement).toBe(selected()?.element)

    await tab(w, /Spells/).trigger('keydown', { key: 'ArrowLeft' })
    expect(selected()?.text()).toMatch(/^Bag/)

    await tab(w, /Bag/).trigger('keydown', { key: 'ArrowLeft' })
    expect(selected()?.text()).toMatch(/^Quests/)

    await tab(w, /Quests/).trigger('keydown', { key: 'ArrowRight' })
    expect(selected()?.text()).toMatch(/^Bag/)

    await tab(w, /Bag/).trigger('keydown', { key: 'End' })
    expect(selected()?.text()).toMatch(/^Quests/)

    await tab(w, /Quests/).trigger('keydown', { key: 'Home' })
    expect(selected()?.text()).toMatch(/^Bag/)
  })

  it('points aria-controls only at the panel that is rendered', () => {
    const w = mountJournal()
    const controls = w
      .findAll('[role="tab"]')
      .map((t) => t.attributes('aria-controls'))

    expect(controls).toEqual(['lq-panel-bag', undefined, undefined])
    expect(w.get('[role="tabpanel"]').attributes('id')).toBe('lq-panel-bag')
  })

  it('says when the bag is empty', () => {
    useGameStore().rawInventory = []
    expect(mountJournal().text()).toContain('Your bag is empty')
  })

  it('expands a bag row to show the whole description', async () => {
    const w = mountJournal()
    const toggle = rowToggle(w, 'Bread')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(w.find('.lq-row-note-full').exists()).toBe(false)

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(w.get('.lq-row-note-full').text()).toBe('A small loaf.')
  })

  it('expands a spell row too', async () => {
    const w = mountJournal()
    const tabs = w.findAll('[role="tab"]')
    await tabs[1].trigger('click')

    await rowToggle(w, 'Revive').trigger('click')

    expect(w.get('.lq-row-note-full').text()).toBe('Restores life.')
  })

  it('lets the keyboard reach the tab panel, even when it is empty', () => {
    useGameStore().rawInventory = []

    expect(mountJournal().get('[role="tabpanel"]').attributes('tabindex')).toBe(
      '0',
    )
  })

  it('names a row toggle by what it shows, so the description is read out', () => {
    const w = mountJournal()
    const apple = rowToggle(w, 'Apple')

    expect(apple.attributes('aria-label')).toBeUndefined()
    expect(apple.text()).toContain('×2')
    expect(apple.text()).toContain('Crisp.')
  })

  describe('locked to one tab (phone sections)', () => {
    it('shows only that tab, without the tab row', () => {
      wrapper = mount(JournalPanel, { props: { tab: 'spells' } })

      expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
      expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false)
      expect(wrapper.get('h2').text()).toBe('Spells')
      expect(wrapper.find('button[aria-label="Cast Revive"]').exists()).toBe(
        true,
      )
    })

    it('marks the shown tab seen', () => {
      useGameStore().spellsHaveNew = true
      wrapper = mount(JournalPanel, { props: { tab: 'spells' } })

      expect(markSeen).toHaveBeenCalledWith('spells')
    })

    it('follows a change of tab', async () => {
      wrapper = mount(JournalPanel, { props: { tab: 'bag' } })

      await wrapper.setProps({ tab: 'quests' })

      expect(wrapper.get('h2').text()).toBe('Quests')
      expect(wrapper.findAll('.lq-quest-name')).toHaveLength(3)
    })
  })

  it('shows a dot on Quests and clears it when the tab is opened', async () => {
    useGameStore().questsHaveNew = true
    const w = mountJournal()
    expect(
      tab(w, /Quests/)
        .find('.lq-dot')
        .exists(),
    ).toBe(true)

    await tab(w, /Quests/).trigger('click')

    expect(markSeen).toHaveBeenCalledWith('quests')
  })

  it('opens a quest asked for from the story', async () => {
    wrapper = mount(JournalPanel, { attachTo: document.body })
    const game = useGameStore()

    game.questToOpen = 'Know your village'
    await flushPromises()

    expect(tab(wrapper, /Quests/).attributes('aria-selected')).toBe('true')
    const toggle = wrapper
      .findAll('.lq-quest-toggle')
      .find((b) => b.text().includes('Know your village'))!
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(toggle.element)
    expect(game.questToOpen).toBe(null)
  })
})
