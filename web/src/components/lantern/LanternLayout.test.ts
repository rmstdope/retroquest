// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

const TURN = {
  command: 'look',
  text: 'Hi',
  room: 'Square',
  roomChanged: false,
  gained: [],
  lost: [],
  arrival: null,
}

describe('LanternLayout', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.documentElement.removeAttribute('data-ui')
  })

  function mountLayout() {
    wrapper = mount(LanternLayout)
    return wrapper
  }

  describe('chapter pages', () => {
    const INTRO = {
      kind: 'intro' as const,
      act: 'Act I',
      title: 'The Call to Adventure',
      body: 'You are Elior.',
    }

    it('shows an act intro as a full-screen chapter', async () => {
      const w = mountLayout()
      const game = useGameStore()
      game.modalChapter = INTRO
      game.showModal = true
      await w.vm.$nextTick()

      const dialog = w.get('[role="dialog"]')
      expect(dialog.classes()).toContain('lq-chapter-dialog')
      expect(dialog.attributes('aria-labelledby')).toBe('lq-dialog-title')
      expect(dialog.get('#lq-dialog-title').text()).toBe(
        'The Call to Adventure',
      )
      expect(w.find('.lq-dialog-layer').exists()).toBe(false)
    })

    it('goes on with Escape as with its button', async () => {
      const w = mountLayout()
      const game = useGameStore()
      const dismiss = vi
        .spyOn(game, 'dismissModal')
        .mockImplementation(() => {})
      game.modalChapter = INTRO
      game.showModal = true
      await w.vm.$nextTick()

      await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })

      expect(dismiss).toHaveBeenCalledOnce()
    })

    it('keeps Tab on the chapter page', async () => {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const game = useGameStore()
      game.modalChapter = INTRO
      game.showModal = true
      await flushPromises()
      const button = wrapper.get('.lq-chapter-button').element
      ;(document.activeElement as HTMLElement | null)?.blur()

      await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Tab' })

      expect(document.activeElement).toBe(button)
    })

    it('takes focus when its text is clicked (Escape and Tab still work)', async () => {
      const w = mountLayout()
      const game = useGameStore()
      game.modalChapter = INTRO
      game.showModal = true
      await w.vm.$nextTick()

      expect(w.get('[role="dialog"]').attributes('tabindex')).toBe('-1')
    })

    it('goes on with the game from the chapter button', async () => {
      const w = mountLayout()
      const game = useGameStore()
      const dismiss = vi
        .spyOn(game, 'dismissModal')
        .mockImplementation(() => {})
      game.modalChapter = INTRO
      game.showModal = true
      await w.vm.$nextTick()

      await w.get('.lq-chapter-button').trigger('click')

      expect(dismiss).toHaveBeenCalledOnce()
    })

    it('moves focus to the chapter when it follows another pop-up', async () => {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const game = useGameStore()
      game.modalTitle = '🏆 Quest Complete!'
      game.showModal = true
      await flushPromises()

      game.modalChapter = { ...INTRO, kind: 'complete' }
      await flushPromises()

      expect(document.activeElement?.className).toContain('lq-chapter-button')
    })

    it('opens the next chapter at its top, not where the last was read to', async () => {
      const w = mountLayout()
      const game = useGameStore()
      game.modalChapter = { ...INTRO, kind: 'complete' }
      game.showModal = true
      await w.vm.$nextTick()
      w.get('.lq-chapter').element.scrollTop = 400

      game.modalChapter = { ...INTRO, act: 'Act II' }
      await w.vm.$nextTick()

      expect(w.get('.lq-chapter').element.scrollTop).toBe(0)
    })

    it('focuses a chapter that is already open when the page appears', async () => {
      const game = useGameStore()
      game.modalChapter = INTRO
      game.showModal = true

      wrapper = mount(LanternLayout, { attachTo: document.body })
      await flushPromises()

      expect(document.activeElement?.className).toContain('lq-chapter-button')
    })
  })

  it('shows a completed quest in the pop-up', async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.modalTitle = '🏆 Quest Complete!'
    game.modalQuest = {
      kind: 'completed',
      name: 'Hint of Magic',
      main: false,
      text: 'It begins.',
      progress: { completed: 5, total: 11 },
    }
    game.showModal = true
    await w.vm.$nextTick()

    const dialog = w.get('[role="dialog"]')
    const title = dialog.get('h2')
    expect(title.text()).toBe('Hint of Magic')
    expect(dialog.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(dialog.get('.lq-dialog-eyebrow').text()).toBe('Side quest complete')
    expect(dialog.find('.lq-complete-count').exists()).toBe(true)
    expect(dialog.text()).not.toContain('🏆')
    expect(dialog.get('footer button').text()).toBe('Continue')
  })

  it('opens the next completion pop-up from its top', async () => {
    const w = mountLayout()
    const game = useGameStore()
    const quest = (name: string) => ({
      kind: 'completed' as const,
      name,
      main: false,
      text: 'Done.',
      progress: { completed: 1, total: 11 },
    })
    game.modalQuest = quest('First')
    game.showModal = true
    await w.vm.$nextTick()
    const first = w.get('.lq-complete').element

    game.modalQuest = quest('Second')
    await w.vm.$nextTick()

    // A fresh scroll box, so the text does not open where the last one was
    // scrolled to.
    expect(w.get('.lq-complete').element).not.toBe(first)
  })

  it('plays the quest sounds (chime and fanfare)', () => {
    const game = useGameStore()
    const setPlayer = vi.spyOn(game, 'setAudioPlayer')
    mountLayout()

    expect(setPlayer).toHaveBeenCalledOnce()
    const player = setPlayer.mock.calls[0]![0]
    expect(typeof player.playNewQuest).toBe('function')
    expect(typeof player.playQuestComplete).toBe('function')
  })

  it("plays the act's music", async () => {
    const play = vi.fn(() => Promise.resolve())
    const created: Array<{ src: string }> = []
    vi.stubGlobal(
      'Audio',
      class {
        src = ''
        loop = false
        volume = 1
        paused = true
        play = play
        pause = vi.fn()
        load = vi.fn()
        removeAttribute = vi.fn()
        constructor() {
          created.push(this)
        }
      },
    )
    mountLayout()

    useGameStore().musicFile = 'willowbrook.mp3'
    await flushPromises()

    expect(created.at(-1)!.src).toContain('willowbrook.mp3')
    vi.unstubAllGlobals()
  })

  it('switches the page to the Lantern look while it is shown', () => {
    const w = mountLayout()
    expect(document.documentElement.getAttribute('data-ui')).toBe('lantern')

    w.unmount()
    wrapper = undefined
    expect(document.documentElement.hasAttribute('data-ui')).toBe(false)
  })

  it('shows save and load notices as a toast', async () => {
    const w = mountLayout()

    useGameStore().notice = { id: 1, text: 'Game saved · Slot 2' }
    await w.vm.$nextTick()

    expect(w.get('[role="status"]').text()).toBe('Game saved · Slot 2')
  })

  it('starts the journal and the actions afresh in a new game', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const w = mountLayout()
    const quests = w
      .findAll('[role="tab"]')
      .find((t) => t.text().startsWith('Quests'))!
    await quests.trigger('click')
    expect(quests.attributes('aria-selected')).toBe('true')

    useGameStore().gameNumber++
    await w.vm.$nextTick()

    const selected = w.get('[role="tab"][aria-selected="true"]')
    expect(selected.text()).toMatch(/^Bag/)
    vi.unstubAllGlobals()
  })

  it("shows a quest's details", async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.rawCompletedQuests = [
      {
        name: '[quest_name]Hint of Magic (side)[/quest_name]',
        description: '[dim]You found it.[/dim]',
      },
    ]

    game.shownQuest = 'Hint of Magic'
    await w.vm.$nextTick()

    const dialog = w.get('[role="dialog"]')
    expect(dialog.get('h2').text()).toBe('Hint of Magic')
    expect(dialog.text()).toContain('Done')
    await dialog.get('button[aria-label="Close"]').trigger('click')
    expect(game.shownQuest).toBe(null)
  })

  it("closes a quest's details when a game pop-up opens", async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.rawActiveQuests = [
      { name: '[quest_name]Hint of Magic[/quest_name]', description: 'Look.' },
    ]
    game.shownQuest = 'Hint of Magic'
    await w.vm.$nextTick()

    game.modalTitle = 'News'
    game.showModal = true
    await w.vm.$nextTick()
    game.showModal = false
    await w.vm.$nextTick()

    expect(game.shownQuest).toBe(null)
    expect(w.find('[role="dialog"]').exists()).toBe(false)
  })

  describe('names in the story', () => {
    async function storyWith(text: string) {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const game = useGameStore()
      game.acceptInput = true
      game.items = ['bucket']
      game.characters = ['grandmother']
      game.turns = [
        {
          id: 1,
          command: 'look',
          text,
          room: 'Cottage',
          roomChanged: false,
          gained: [],
          lost: [],
          arrival: null,
        },
      ]
      await flushPromises()
      return wrapper
    }

    it('opens a menu of what fits and runs the picked action', async () => {
      const w = await storyWith('You see a [item_name]bucket[/item_name].')
      const submit = vi
        .spyOn(useGameStore(), 'submitCommand')
        .mockImplementation(() => {})

      await w.get('.lq-story .theme-item_name').trigger('click')
      const menu = w.get('[role="menu"]')
      expect(menu.findAll('[role="menuitem"]').map((m) => m.text())).toEqual([
        'Take',
        'Examine',
      ])
      expect(document.activeElement?.textContent?.trim()).toBe('Take')

      await menu.findAll('[role="menuitem"]')[0].trigger('click')

      expect(submit).toHaveBeenCalledWith('take bucket')
      expect(w.find('[role="menu"]').exists()).toBe(false)
    })

    it('closes the menu with Escape', async () => {
      const w = await storyWith(
        '[character_name]Grandmother[/character_name] smiles.',
      )
      const before = w.get('button[aria-label="Text size"]')
        .element as HTMLElement
      before.focus()
      await w.get('.lq-story .theme-character_name').trigger('click')
      await flushPromises()

      await w.get('[role="menu"]').trigger('keydown', { key: 'Escape' })

      expect(w.find('[role="menu"]').exists()).toBe(false)
      // Focus goes back to where it was (a name in the text cannot take it).
      expect(document.activeElement).toBe(before)
    })

    it('opens nothing for something that is not here', async () => {
      const w = await storyWith(
        'You remember [character_name]Mira[/character_name].',
      )

      await w.get('.lq-story .theme-character_name').trigger('click')

      expect(w.find('[role="menu"]').exists()).toBe(false)
    })
  })

  it('asks before quitting', async () => {
    const w = mountLayout()

    useGameStore().quitAsked = true
    await w.vm.$nextTick()

    expect(w.get('[role="dialog"] h2').text()).toBe('Quit game?')
  })

  it('shows quest news in the story while it is shown', () => {
    const w = mountLayout()
    expect(useGameStore().lanternFeedback).toBe(true)

    w.unmount()
    wrapper = undefined
    expect(useGameStore().lanternFeedback).toBe(false)
  })

  it('shows the header', () => {
    expect(mountLayout().text()).toContain('RetroQuest')
  })

  it('lists the turns with their command and rendered answer', async () => {
    const w = mountLayout()
    useGameStore().turns = [
      {
        id: 1,
        command: null,
        text: 'You look around.',
        room: 'Square',
        roomChanged: true,
        gained: [],
        lost: [],
        arrival: null,
      },
      {
        id: 2,
        command: 'take bucket',
        text: '[item_name]Bucket[/item_name] taken.',
        room: 'Square',
        roomChanged: false,
        gained: [],
        lost: [],
        arrival: null,
      },
    ]
    await w.vm.$nextTick()

    const turns = w.findAll('[data-testid="turn"]')
    expect(turns).toHaveLength(2)
    expect(turns[1].text()).toContain('take bucket')
    expect(turns[1].find('.theme-item_name').text()).toBe('Bucket')
  })

  it('plays through the action composer', async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.acceptInput = true
    const submit = vi.spyOn(game, 'submitCommand').mockImplementation(() => {})
    await w.vm.$nextTick()

    expect(w.find('[aria-label="Actions"]').exists()).toBe(true)
    const look = w.findAll('button').find((b) => b.text() === 'Look')
    await look!.trigger('click')

    expect(submit).toHaveBeenCalledWith('look')
  })

  it('disables the actions while the game is not accepting input', () => {
    const w = mountLayout()

    const look = w.findAll('button').find((b) => b.text() === 'Look')
    expect(look!.attributes()).toHaveProperty('disabled')
  })

  it('shows pending pop-ups (act intro, quests) and continues on request', async () => {
    const w = mountLayout()
    const game = useGameStore()
    const dismiss = vi.spyOn(game, 'dismissModal').mockImplementation(() => {})
    game.modalTitle = 'Act Intro'
    game.modalBody = '<span class="theme-bold">ACT 1</span>'
    game.showModal = true
    await w.vm.$nextTick()

    const dialog = w.get('[role="dialog"]')
    expect(dialog.text()).toContain('Act Intro')
    expect(dialog.find('.theme-bold').text()).toBe('ACT 1')

    await dialog.get('button').trigger('click')
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it('moves focus to Continue when a pop-up opens', async () => {
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    game.modalTitle = 'Act Intro'
    game.showModal = true
    await wrapper.vm.$nextTick()

    expect(document.activeElement?.textContent?.trim()).toBe('Continue')
  })

  it('returns focus to the actions when the last pop-up closes', async () => {
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    game.showModal = true
    await wrapper.vm.$nextTick()

    game.showModal = false
    game.acceptInput = true
    await wrapper.vm.$nextTick()

    expect(document.activeElement?.textContent?.trim()).toBe('Look')
  })

  it('continues the pop-up with Escape', async () => {
    const w = mountLayout()
    const game = useGameStore()
    const dismiss = vi.spyOn(game, 'dismissModal').mockImplementation(() => {})
    game.showModal = true
    await w.vm.$nextTick()

    await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it('brings the start of the newest turn into view', async () => {
    const scrolled: Element[] = []
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this)
    }
    const w = mountLayout()
    const turn = {
      command: 'look',
      text: 'Hi',
      room: 'Square',
      roomChanged: false,
      gained: [],
      lost: [],
      arrival: null,
    }
    useGameStore().turns = [
      { id: 1, ...turn },
      { id: 2, ...turn },
    ]
    await w.vm.$nextTick()
    await w.vm.$nextTick()

    const turns = w.findAll('[data-testid="turn"]')
    expect(scrolled.at(-1)).toBe(turns[1].element)
  })

  it('shows no pop-up when none is pending', () => {
    expect(mountLayout().find('[role="dialog"]').exists()).toBe(false)
  })

  it('heads the story with a level-two heading for screen readers', () => {
    expect(mountLayout().get('section[aria-label="Story"] h2').text()).toBe(
      'Story',
    )
  })

  describe('on a laptop (at least 1024px wide)', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      )
    })

    afterEach(() => vi.unstubAllGlobals())

    it('shows the room card above the story', () => {
      useGameStore().roomName = 'Village Square'
      const w = mountLayout()

      expect(w.find('[aria-label="Current location"]').exists()).toBe(true)
    })

    it('shows the map and journal beside the story', () => {
      const w = mountLayout()

      const aside = w.get('aside')
      expect(aside.find('[aria-label="Map"]').exists()).toBe(true)
      expect(aside.find('[aria-label="Journal"]').exists()).toBe(true)
    })
  })

  it('keeps the single column on smaller screens', () => {
    const w = mountLayout()

    expect(w.find('aside').exists()).toBe(false)
    expect(w.find('[aria-label="Current location"]').exists()).toBe(false)
  })

  describe('on a phone', () => {
    function stubScreen(short: boolean) {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: query.includes('max-height') ? short : false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      )
    }

    beforeEach(() => stubScreen(false))
    afterEach(() => vi.unstubAllGlobals())

    function sections(w: VueWrapper) {
      return w.get('nav[aria-label="Sections"]')
    }

    async function open(w: VueWrapper, name: string) {
      const button = sections(w)
        .findAll('button')
        .find((b) => b.text() === name)
      await button!.trigger('click')
    }

    it('starts on the story with the section tabs at the bottom', () => {
      const w = mountLayout()

      expect(w.find('header .lq-compact-room').exists()).toBe(true)
      expect(sections(w).classes()).toContain('lq-nav-bottom')
      expect(sections(w).get('[aria-current="page"]').text()).toBe('Story')
      expect(w.get('[aria-label="Story"]').isVisible()).toBe(true)
    })

    it('shows the bag in place of the story and keeps the story', async () => {
      const w = mountLayout()

      await open(w, 'Bag')

      expect(w.get('[aria-label="Journal"] h2').text()).toBe('Bag')
      expect(w.get('section[aria-label="Story"]').isVisible()).toBe(false)
      expect(w.get('section[aria-label="Actions"]').isVisible()).toBe(false)
    })

    it('shows the map', async () => {
      const w = mountLayout()

      await open(w, 'Map')

      expect(w.get('[aria-label="Map"] h2').text()).toBe('Map')
      expect(w.find('[aria-label="Map"]').exists()).toBe(true)
      expect(w.find('[aria-label="Journal"]').exists()).toBe(false)
    })

    it('returns to the story when a command runs from another section', async () => {
      const w = mountLayout()
      await open(w, 'Map')

      useGameStore().turns = [
        {
          id: 1,
          command: 'go north',
          text: 'You walk north.',
          room: 'Hall',
          roomChanged: false,
          gained: [],
          lost: [],
          arrival: null,
        },
      ]
      await w.vm.$nextTick()

      expect(sections(w).get('[aria-current="page"]').text()).toBe('Story')
    })

    it('returns to the story once the story is full (oldest turn dropped)', async () => {
      const w = mountLayout()
      const game = useGameStore()
      game.turns = [{ ...TURN, id: 1 }]
      await w.vm.$nextTick()
      await open(w, 'Map')

      // At the turn cap a new turn replaces the oldest: the count stays.
      game.turns = [{ ...TURN, id: 2 }]
      await flushPromises()

      expect(sections(w).get('[aria-current="page"]').text()).toBe('Story')
    })

    it('scrolls to the new turn once the story is shown again', async () => {
      const shownWhenScrolled: boolean[] = []
      Element.prototype.scrollIntoView = function (this: Element) {
        const story = this.closest<HTMLElement>('.lq-story')
        shownWhenScrolled.push(story?.style.display !== 'none')
      }
      const w = mountLayout()
      await open(w, 'Map')

      useGameStore().turns = [{ ...TURN, id: 1 }]
      await flushPromises()

      expect(shownWhenScrolled).toEqual([true])
    })

    it('moves focus to the actions after Use from the bag', async () => {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const w = wrapper
      const game = useGameStore()
      game.acceptInput = true
      game.rawInventory = [{ name: 'bread', description: 'A loaf.' }]
      vi.spyOn(game, 'submitCommand').mockImplementation(() => {
        game.turns = [{ ...TURN, id: 1, command: 'use bread' }]
      })
      await open(w, 'Bag')
      const use = w.get('[aria-label="Use Bread"]')
      ;(use.element as HTMLElement).focus()

      await use.trigger('click')
      await flushPromises()

      expect(document.activeElement?.textContent?.trim()).toBe('Look')
    })

    it('returns to the story after the window was laptop-wide', async () => {
      const listeners: Array<(e: { matches: boolean }) => void> = []
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: false,
          addEventListener: (
            _: string,
            fn: (e: { matches: boolean }) => void,
          ) => {
            if (query.includes('min-width')) listeners.push(fn)
          },
          removeEventListener: vi.fn(),
        })),
      )
      const w = mountLayout()
      await open(w, 'Map')

      listeners.forEach((fn) => fn({ matches: true }))
      await w.vm.$nextTick()
      listeners.forEach((fn) => fn({ matches: false }))
      await w.vm.$nextTick()

      expect(sections(w).get('[aria-current="page"]').text()).toBe('Story')
    })

    it('switches to Quests when a quest is opened from the story', async () => {
      const w = mountLayout()

      useGameStore().openQuestInJournal('Hint of Magic')
      await flushPromises()

      expect(sections(w).get('[aria-current="page"]').text()).toMatch(/^Quests/)
    })

    it('moves the section tabs into the header on a short screen', () => {
      stubScreen(true)
      const w = mountLayout()

      expect(w.get('header').find('nav[aria-label="Sections"]').exists()).toBe(
        true,
      )
      expect(sections(w).classes()).toContain('lq-nav-top')
    })
  })

  describe('the action dock on a phone', () => {
    function stubScreen(short: boolean) {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: query.includes('max-height') ? short : false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      )
    }

    /** Pretend each turn is `turn` px tall in a story `story` px tall. */
    function stubHeights(turn: number, story: number) {
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.classList.contains('lq-story') ? story : turn
        },
      )
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.classList.contains('lq-story') ? story : turn
        },
      )
    }

    function mountAttached() {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      return wrapper
    }

    function actions(w: VueWrapper) {
      return w.get('section[aria-label="Actions"]')
    }

    async function addTurn(w: VueWrapper, id: number) {
      useGameStore().turns = [
        {
          id,
          command: 'look',
          text: 'You look around.',
          room: 'Hall',
          roomChanged: false,
          gained: [],
          lost: [],
          arrival: null,
        },
      ]
      await flushPromises()
      await w.vm.$nextTick()
    }

    beforeEach(() => stubScreen(false))
    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    it('starts with the actions open as a sheet', () => {
      const w = mountLayout()

      expect(actions(w).isVisible()).toBe(true)
      expect(actions(w).classes()).toContain('lq-sheet')
      expect(w.find('[aria-label="Action bar"]').exists()).toBe(false)
    })

    it('starts folded on a short screen', () => {
      stubScreen(true)
      const w = mountLayout()

      expect(actions(w).isVisible()).toBe(false)
      expect(w.find('[aria-label="Action bar"]').exists()).toBe(true)
    })

    it('folds with Hide actions and keeps the focus on the bar', async () => {
      const w = mountAttached()

      await w.get('button[aria-label="Hide actions"]').trigger('click')
      await flushPromises()

      expect(actions(w).isVisible()).toBe(false)
      expect(document.activeElement).toBe(w.get('button.lq-dock-open').element)
    })

    it('opens again into Actions or straight into typing', async () => {
      stubScreen(true)
      useGameStore().acceptInput = true
      const w = mountAttached()

      await w.get('button[aria-label="Type a command"]').trigger('click')
      await flushPromises()

      expect(actions(w).isVisible()).toBe(true)
      expect(document.activeElement).toBe(
        w.get('input[aria-label="Command"]').element,
      )
    })

    it('folds when the answer does not fit beside the actions', async () => {
      stubHeights(900, 300)
      const w = mountAttached()

      await addTurn(w, 7)

      expect(actions(w).isVisible()).toBe(false)
      expect(document.activeElement).toBe(w.get('button.lq-dock-open').element)
    })

    it('stays open when the answer fits', async () => {
      stubHeights(100, 300)
      const w = mountLayout()

      await addTurn(w, 7)

      expect(actions(w).isVisible()).toBe(true)
    })

    it('puts the focus back on the bar when its exit button has gone', async () => {
      stubScreen(true)
      const game = useGameStore()
      game.acceptInput = true
      game.exits = { north: 'Hall' }
      const w = mountAttached()
      ;(w.get('button.lq-dock-exit').element as HTMLElement).focus()

      game.exits = { south: 'Square' }
      await addTurn(w, 7)

      expect(document.activeElement).toBe(w.get('button.lq-dock-open').element)
    })

    it('folds after every answer on a short screen', async () => {
      stubScreen(true)
      stubHeights(50, 300)
      const w = mountLayout()
      await w.get('button.lq-dock-open').trigger('click')

      await addTurn(w, 7)

      expect(actions(w).isVisible()).toBe(false)
    })
  })

  it('has no action dock or hide button on a laptop', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const w = mountLayout()

    expect(w.find('[aria-label="Action bar"]').exists()).toBe(false)
    expect(w.find('button[aria-label="Hide actions"]').exists()).toBe(false)
    vi.unstubAllGlobals()
  })

  describe('"More below" for long turns', () => {
    /** Give the story scroll metrics (jsdom has no layout). */
    function stubStory(w: VueWrapper, scrollHeight: number, scrollTop = 0) {
      const story = w.get('section[aria-label="Story"]').element as HTMLElement
      Object.defineProperty(story, 'scrollHeight', {
        configurable: true,
        value: scrollHeight,
      })
      Object.defineProperty(story, 'clientHeight', {
        configurable: true,
        value: 300,
      })
      story.scrollTop = scrollTop
      const scrollBy = vi.fn()
      story.scrollBy = scrollBy as unknown as typeof story.scrollBy
      return { story, scrollBy }
    }

    async function addTurn(w: VueWrapper) {
      useGameStore().turns = [
        {
          id: 42,
          command: 'talk to spirit',
          text: 'A very long answer.',
          room: 'Grove',
          roomChanged: false,
          gained: [],
          lost: [],
          arrival: null,
        },
      ]
      await flushPromises()
      await w.vm.$nextTick()
    }

    it('shows a pill when a new turn goes on below the story', async () => {
      const w = mountLayout()
      stubStory(w, 2000)

      await addTurn(w)

      expect(w.get('button.lq-more-below').text()).toBe('More below ↓')
    })

    it('has no pill when everything is in view', async () => {
      const w = mountLayout()
      stubStory(w, 300)

      await addTurn(w)

      expect(w.find('button.lq-more-below').exists()).toBe(false)
    })

    it('scrolls down by almost a screen when the pill is pressed', async () => {
      const w = mountLayout()
      const { scrollBy } = stubStory(w, 2000)
      await addTurn(w)

      await w.get('button.lq-more-below').trigger('click')

      expect(scrollBy).toHaveBeenCalledWith(
        expect.objectContaining({ top: 252 }),
      )
    })

    it('hides the pill once the reader reaches the end', async () => {
      const w = mountLayout()
      const { story } = stubStory(w, 2000)
      await addTurn(w)

      story.scrollTop = 1700
      await w.get('section[aria-label="Story"]').trigger('scroll')

      expect(w.find('button.lq-more-below').exists()).toBe(false)
    })

    it('is named "More below" for screen readers (the arrow is decoration)', async () => {
      const w = mountLayout()
      stubStory(w, 2000)
      await addTurn(w)

      const arrow = w.get('button.lq-more-below [aria-hidden="true"]')
      expect(arrow.text()).toBe('↓')
    })

    it('has no pill when the story is too short to hold it', async () => {
      const w = mountLayout()
      const { story } = stubStory(w, 2000)
      Object.defineProperty(story, 'clientHeight', {
        configurable: true,
        value: 30,
      })

      await addTurn(w)

      expect(w.find('button.lq-more-below').exists()).toBe(false)
    })

    it('follows the story when it is resized without scrolling', async () => {
      const observed: Array<() => void> = []
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(cb: () => void) {
            observed.push(cb)
          }
          observe() {}
          disconnect() {}
        },
      )
      const w = mountLayout()
      const { story } = stubStory(w, 300)
      await addTurn(w)
      expect(w.find('button.lq-more-below').exists()).toBe(false)

      Object.defineProperty(story, 'clientHeight', {
        configurable: true,
        value: 150,
      })
      observed.forEach((cb) => cb())
      await w.vm.$nextTick()

      expect(w.find('button.lq-more-below').exists()).toBe(true)
      vi.unstubAllGlobals()
    })

    it('follows the story when the text size changes', async () => {
      const w = mountLayout()
      const { story } = stubStory(w, 300)
      await addTurn(w)
      expect(w.find('button.lq-more-below').exists()).toBe(false)

      Object.defineProperty(story, 'scrollHeight', {
        configurable: true,
        value: 400,
      })
      useSettingsStore().textSize = 'large'
      await flushPromises()

      expect(w.find('button.lq-more-below').exists()).toBe(true)
    })

    it('hands focus to the actions when the pill goes at the end', async () => {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const w = wrapper
      useGameStore().acceptInput = true
      const { story } = stubStory(w, 2000)
      await addTurn(w)
      const pill = w.get('button.lq-more-below')
      ;(pill.element as HTMLElement).focus()

      story.scrollTop = 1700
      await w.get('section[aria-label="Story"]').trigger('scroll')

      expect(w.find('button.lq-more-below').exists()).toBe(false)
      expect(document.activeElement?.textContent?.trim()).toBe('Look')
    })
  })

  describe('game menu, stats and help', () => {
    function phone() {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      )
    }

    afterEach(() => vi.unstubAllGlobals())

    it('opens the game menu from the header on a phone', async () => {
      phone()
      const w = mountLayout()

      await w.get('button[aria-label="Game menu"]').trigger('click')

      expect(w.get('[role="dialog"] h2').text()).toBe('Game')
    })

    it('shows Stats from the menu and gives focus back to the menu button', async () => {
      phone()
      const game = useGameStore()
      vi.spyOn(game, 'readInfo').mockReturnValue(
        '[bold]Current Room:[/bold] Square',
      )
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const menuButton = wrapper.get('button[aria-label="Game menu"]')
      ;(menuButton.element as HTMLElement).focus()
      await menuButton.trigger('click')
      await flushPromises()

      const stats = wrapper
        .findAll('[role="dialog"] button')
        .find((b) => b.text().startsWith('Stats'))!
      await stats.trigger('click')
      await flushPromises()

      const dialog = wrapper.get('[role="dialog"]')
      expect(dialog.get('h2').text()).toBe('Stats')
      expect(dialog.text()).toContain('Current Room: Square')
      expect(game.readInfo).toHaveBeenCalledWith('stats')

      await dialog.get('button[aria-label="Close"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(document.activeElement).toBe(menuButton.element)
    })

    it('opens Load game from the menu', async () => {
      phone()
      const game = useGameStore()
      vi.spyOn(game, 'getSaveSlots').mockReturnValue([])
      vi.spyOn(game, 'getQuickSave').mockReturnValue(null)
      const w = mountLayout()

      await w.get('button[aria-label="Game menu"]').trigger('click')
      await w
        .findAll('[role="dialog"] button')
        .find((b) => b.text().startsWith('Load game'))!
        .trigger('click')

      expect(w.get('[role="dialog"] h2').text()).toBe('Load game')
    })

    it('opens Settings from the menu', async () => {
      phone()
      const w = mountLayout()

      await w.get('button[aria-label="Game menu"]').trigger('click')
      await w
        .findAll('[role="dialog"] button')
        .find((b) => b.text().startsWith('Settings'))!
        .trigger('click')

      expect(w.get('[role="dialog"] h2').text()).toBe('Settings')
    })

    it('closes the menu when a game pop-up opens', async () => {
      phone()
      const w = mountLayout()
      await w.get('button[aria-label="Game menu"]').trigger('click')
      const game = useGameStore()

      game.modalTitle = 'News'
      game.showModal = true
      await w.vm.$nextTick()
      game.showModal = false
      await w.vm.$nextTick()

      expect(w.find('[role="dialog"]').exists()).toBe(false)
    })

    it('shows Help from the laptop header', async () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: query.includes('min-width'),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      )
      const game = useGameStore()
      vi.spyOn(game, 'readInfo').mockReturnValue(
        '[bold]Available Commands:[/bold]',
      )
      const w = mountLayout()

      const help = w.findAll('header button').find((b) => b.text() === 'Help')!
      await help.trigger('click')

      expect(w.get('[role="dialog"] h2').text()).toBe('Help')
      expect(w.get('[role="dialog"]').text()).toContain('Available Commands:')
    })
  })
})
