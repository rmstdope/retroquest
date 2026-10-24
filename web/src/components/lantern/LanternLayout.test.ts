// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SCENE_PAUSE_MS } from '@/lantern/narrationUnits'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import type { Turn } from '@/stores/useGameStore'

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
        .spyOn(game, 'continueChapter')
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
        .spyOn(game, 'continueChapter')
        .mockImplementation(() => {})
      game.modalChapter = INTRO
      game.showModal = true
      await w.vm.$nextTick()

      await w.get('.lq-chapter-button').trigger('click')

      expect(dismiss).toHaveBeenCalledOnce()
    })

    const FINAL = {
      kind: 'complete' as const,
      act: 'Act IV',
      title: 'The Long Night Ends',
      body: 'Congratulations — you have completed Act 4!',
      stats: { questsCompleted: 6, questsTotal: 6, spells: 14, places: 18 },
      final: true,
    }

    it('asks to save over the last chapter, then gives focus back to Finish the game', async () => {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const game = useGameStore()
      game.modalChapter = FINAL
      game.showModal = true
      await flushPromises()
      const finish = wrapper.get('.lq-chapter-button')
      expect(finish.text()).toBe('Finish the game')

      await finish.trigger('click')
      await flushPromises()

      expect(game.finishAsked).toBe(true)
      const dialog = wrapper.get('.lq-dialog-layer [role="dialog"]')
      expect(dialog.get('h2').text()).toBe('Save before you finish?')
      expect(wrapper.find('.lq-chapter-dialog').exists()).toBe(true)
      expect(document.activeElement?.textContent?.trim()).toBe(
        'Save and finish',
      )

      await dialog.trigger('keydown', { key: 'Escape' })
      await flushPromises()

      expect(game.finishAsked).toBe(false)
      expect(wrapper.find('.lq-dialog-layer').exists()).toBe(false)
      expect(document.activeElement).toBe(
        wrapper.get('.lq-chapter-button').element,
      )
    })

    it('opens the save dialog with Escape on the last chapter', async () => {
      const w = mountLayout()
      const game = useGameStore()
      game.modalChapter = FINAL
      game.showModal = true
      await w.vm.$nextTick()

      await w.get('.lq-chapter-dialog').trigger('keydown', { key: 'Escape' })

      expect(game.finishAsked).toBe(true)
      expect(game.showModal).toBe(true)
    })

    it('moves focus to the chapter when it follows another chapter', async () => {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const game = useGameStore()
      game.modalChapter = { ...INTRO, kind: 'complete' }
      game.showModal = true
      await flushPromises()
      ;(document.activeElement as HTMLElement | null)?.blur()

      game.modalChapter = INTRO
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

  it('shows only the end screen once the game has ended, music still playing', async () => {
    const pause = vi.fn()
    vi.stubGlobal(
      'Audio',
      class {
        src = ''
        loop = false
        volume = 1
        paused = false
        play = vi.fn(() => Promise.resolve())
        pause = pause
        load = vi.fn()
        removeAttribute = vi.fn()
      },
    )
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    game.musicFile = 'act4.mp3'
    game.turns = [{ ...TURN, id: 1 }]
    await flushPromises()
    // Loading the track pauses the old one; only a pause after it counts.
    pause.mockClear()

    game.ending = { text: 'The realm breathes again.', saved: true }
    game.notice = { id: 1, text: 'Game saved' }
    await flushPromises()

    const w = wrapper
    expect(w.get('h1').text()).toBe('Thank you for playing RetroQuest')
    expect(w.text()).toContain('The realm breathes again.')
    expect(w.text()).toContain('Your game is saved in the quick slot.')
    expect(w.find('header').exists()).toBe(false)
    expect(w.find('[aria-label="Story"]').exists()).toBe(false)
    expect(w.find('.lq-composer').exists()).toBe(false)
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Game saved')
    expect(w.findAll('button, input, textarea, select, a')).toHaveLength(0)
    expect(document.activeElement).toBe(w.get('h1').element)
    expect(pause).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
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
    game.completedQuests = [
      {
        name: 'Hint of Magic',
        main: false,
        done: true,
        details: { kind: 'journal', latest: 'You found it.', earlier: [] },
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
    game.activeQuests = [
      {
        name: 'Hint of Magic',
        main: false,
        done: false,
        details: { kind: 'journal', latest: 'Look.', earlier: [] },
      },
    ]
    game.shownQuest = 'Hint of Magic'
    await w.vm.$nextTick()

    game.modalChapter = { kind: 'intro', act: 'Act II', title: 'T', body: 'B' }
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
      // Focus goes on to the actions, not lost with the menu.
      expect(document.activeElement).not.toBe(document.body)
      expect(w.get('.lq-story').element.contains(document.activeElement)).toBe(
        false,
      )
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

    it('sends focus to the actions when nothing had it before the menu', async () => {
      const w = await storyWith('You see a [item_name]bucket[/item_name].')
      ;(document.activeElement as HTMLElement | null)?.blur()
      await w.get('.lq-story .theme-item_name').trigger('click')
      await flushPromises()

      await w.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
      await flushPromises()

      expect(document.activeElement).not.toBe(document.body)
      expect(w.get('.lq-story').element.contains(document.activeElement)).toBe(
        false,
      )
    })

    it('leaves focus be when a scroll closes the menu', async () => {
      const w = await storyWith('You see a [item_name]bucket[/item_name].')
      ;(document.activeElement as HTMLElement | null)?.blur()
      await w.get('.lq-story .theme-item_name').trigger('click')
      await flushPromises()

      document.body.dispatchEvent(new Event('scroll'))
      await flushPromises()

      expect(w.find('[role="menu"]').exists()).toBe(false)
      expect(document.activeElement).toBe(document.body)
    })

    it('opens nothing for something that is not here', async () => {
      const w = await storyWith(
        'You remember [character_name]Mira[/character_name].',
      )

      await w.get('.lq-story .theme-character_name').trigger('click')

      expect(w.find('[role="menu"]').exists()).toBe(false)
    })

    it('opens the menu from a Here chip on arrival, and focus goes back to it', async () => {
      const w = await storyWith('You arrive.')
      const game = useGameStore()
      game.roomName = 'Cottage'
      game.turns[0].arrival = {
        room: 'Cottage',
        description: 'A cottage.',
        characters: ['grandmother'],
        items: ['bucket'],
        exits: {},
      }
      await flushPromises()
      const submit = vi
        .spyOn(game, 'submitCommand')
        .mockImplementation(() => {})

      const chip = w.get('[data-testid="here"] button.lq-here-character')
      ;(chip.element as HTMLElement).focus()
      await chip.trigger('click')
      await flushPromises()
      const menu = w.get('[role="menu"]')
      expect(menu.findAll('[role="menuitem"]').map((m) => m.text())).toEqual([
        'Talk to',
        'Examine',
      ])
      await menu.trigger('keydown', { key: 'Escape' })
      expect(document.activeElement).toBe(chip.element)

      await chip.trigger('click')
      await w.get('[role="menuitem"]').trigger('click')
      expect(submit).toHaveBeenCalledWith('talk to grandmother')
    })

    it('closes on a scroll without scrolling back to the chip', async () => {
      const w = await storyWith('You arrive.')
      const game = useGameStore()
      game.roomName = 'Cottage'
      game.turns[0].arrival = {
        room: 'Cottage',
        description: 'A cottage.',
        characters: ['grandmother'],
        items: [],
        exits: {},
      }
      await flushPromises()
      const chip = w.get('[data-testid="here"] button.lq-here-character')
      await chip.trigger('click')
      await flushPromises()
      const focus = vi.spyOn(chip.element as HTMLElement, 'focus')

      await w.get('.lq-story').trigger('scroll')

      expect(w.find('[role="menu"]').exists()).toBe(false)
      // The player scrolled away: focus goes back without moving the story.
      expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    })
  })

  it('opens the menu from a Here chip in the laptop room card', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    game.acceptInput = true
    game.items = ["Elior's Journal"]
    await flushPromises()
    const submit = vi.spyOn(game, 'submitCommand').mockImplementation(() => {})

    await wrapper
      .get('[aria-label="Current location"] button.lq-here-item')
      .trigger('click')
    await wrapper.get('[role="menuitem"]').trigger('click')

    expect(submit).toHaveBeenCalledWith("take elior's journal")
    vi.unstubAllGlobals()
  })

  it('shows the title page over the first chapter, then the chapter', async () => {
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    game.modalChapter = {
      kind: 'intro',
      act: 'Act I',
      title: 'The Call to Adventure',
      body: 'You are Elior.',
    }
    game.showModal = true
    game.titleText = 'Welcome\n[bold yellow]\n###\n[/bold yellow]'
    game.showTitle = true
    await flushPromises()
    expect(document.activeElement?.textContent?.trim()).toBe('Start')

    await wrapper.get('.lq-title-start').trigger('click')
    await flushPromises()

    expect(wrapper.find('.lq-title-start').exists()).toBe(false)
    expect(document.activeElement?.className).toContain('lq-chapter-button')
  })

  it('asks before quitting', async () => {
    const w = mountLayout()

    useGameStore().quitAsked = true
    await w.vm.$nextTick()

    expect(w.get('[role="dialog"] h2').text()).toBe('Quit game?')
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

      game.modalChapter = {
        kind: 'intro',
        act: 'Act II',
        title: 'T',
        body: 'B',
      }
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

  describe('narration', () => {
    const FIRST = 'Rain falls.'
    const SECOND = 'Then it stops.'
    const HEADING = 'Act I: The Call'
    const BODY = 'The wind rises.'
    const DONE = 'You did it.'
    const audios: NarrationAudio[] = []

    /** A turn of two narration lines the manifest has recordings for. */
    function narratedTurn(id: number, extra: Partial<Turn> = {}): Turn {
      return {
        id,
        command: 'look',
        text: `${FIRST}\n${SECOND}`,
        room: 'Square',
        roomChanged: false,
        gained: [],
        lost: [],
        arrival: null,
        narrate: true,
        ...extra,
      }
    }

    async function ready(): Promise<VueWrapper> {
      vi.useFakeTimers()
      const manifest = Object.fromEntries(
        [
          FIRST,
          SECOND,
          HEADING,
          BODY,
          DONE,
          'New side quest',
          'Q1',
          'A.',
          'Q2',
          'B.',
        ].map((line) => [
          narrationKey('narrator', line),
          {
            file: 'x.mp3',
            speaker: 'narrator',
            duration: 5,
            words: narrationWords(line).map((word, i) => ({
              word,
              start: i,
              end: i + 1,
            })),
          },
        ]),
      )
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: true, json: async () => manifest })),
      )
      const narration = useNarrationStore()
      narration.setAudioFactory(() => {
        const audio: NarrationAudio = {
          volume: 1,
          currentTime: 0,
          onended: null,
          onerror: null,
          play: () => Promise.resolve(),
          pause: () => undefined,
        }
        audios.push(audio)
        return audio
      })
      const w = mount(LanternLayout, { attachTo: document.body })
      wrapper = w
      useGameStore().actLabel = 'Act I'
      await vi.advanceTimersByTimeAsync(0)
      return w
    }

    async function say(turn: Turn): Promise<void> {
      useGameStore().turns.push(turn)
      await vi.advanceTimersByTimeAsync(0)
    }

    const texts = (w: VueWrapper): string[] =>
      w.findAll('.lq-block-text').map((p) => p.text())

    beforeEach(() => {
      audios.length = 0
      // Settings are saved in localStorage where there is one: start each test with narration on.
      try {
        localStorage.clear()
      } catch {
        // No storage in this environment.
      }
      setActivePinia(createPinia())
      useSettingsStore().narrationOn = true
    })
    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    })

    it("tells a typed command's answer block by block", async () => {
      const w = await ready()
      await say(narratedTurn(1))
      expect(texts(w)).toEqual([FIRST])

      audios[0].onended?.()
      await vi.advanceTimersByTimeAsync(350)
      expect(texts(w)).toEqual([FIRST, SECOND])
    })

    it('rings a chime for each quest card as its reading starts, not when the turn starts', async () => {
      const w = await ready()
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      useGameStore().setAudioPlayer(audio)
      const card = (name: string, text: string) => ({
        kind: 'new' as const,
        name,
        main: false,
        text,
        chime: true as const,
      })
      await say(
        narratedTurn(1, { quests: [card('Q1', 'A.'), card('Q2', 'B.')] }),
      )
      expect(audio.playNewQuest).not.toHaveBeenCalled()
      audios[0].onended?.()
      await vi.advanceTimersByTimeAsync(350)
      expect(audio.playNewQuest).not.toHaveBeenCalled()
      audios[1].onended?.()
      await vi.advanceTimersByTimeAsync(350)
      expect(w.find('[data-unit="2"]').exists()).toBe(true)
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      // The first card's heading, name and text, one after another.
      for (const index of [2, 3, 4]) {
        audios[index].onended?.()
        await vi.advanceTimersByTimeAsync(350)
      }
      expect(w.find('[data-unit="3"]').exists()).toBe(true)
      expect(audio.playNewQuest).toHaveBeenCalledTimes(2)
    })

    it('rings one chime at once for quest cards shown together', async () => {
      await ready()
      const audio = { playNewQuest: vi.fn(), playQuestComplete: vi.fn() }
      useGameStore().setAudioPlayer(audio)
      await say(
        narratedTurn(1, {
          narrate: undefined,
          quests: [
            {
              kind: 'updated',
              name: 'Q',
              main: false,
              text: 'Later.',
              chime: true,
            },
            { kind: 'new', name: 'R', main: true, text: 'Go.', chime: true },
          ],
        }),
      )
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
    })

    it('holds the act-complete page until the act’s last turn has been read', async () => {
      await ready()
      const game = useGameStore()
      const resume = vi.spyOn(game, 'resumeActEnd').mockImplementation(() => {})
      const turn = narratedTurn(1)
      await say(turn)
      game.actEndPending = true
      await vi.advanceTimersByTimeAsync(0)
      expect(resume).not.toHaveBeenCalled()
      audios[0].onended?.()
      await vi.advanceTimersByTimeAsync(350)
      audios[1].onended?.()
      await vi.advanceTimersByTimeAsync(0)
      expect(resume).toHaveBeenCalled()
    })

    it('asks to hold the act-complete page only for a turn that will be read', async () => {
      const gate = vi.spyOn(useGameStore(), 'setActEndGate')
      await ready()
      const held = gate.mock.calls.at(-1)?.[0]
      expect(held?.(narratedTurn(1))).toBe(true)
      expect(held?.(narratedTurn(2, { narrate: undefined }))).toBe(false)
      useSettingsStore().narrationOn = false
      expect(held?.(narratedTurn(3))).toBe(false)
    })

    it('shows a restored or opening turn, or one with narration off, at once', async () => {
      const w = await ready()
      await say(narratedTurn(1, { narrate: undefined }))
      expect(texts(w)).toEqual([FIRST, SECOND])

      useSettingsStore().narrationOn = false
      await say(narratedTurn(2))
      expect(w.findAll('.lq-block-text')).toHaveLength(4)
    })

    it('leaves a turn without recordings, or a turn behind a pop-up, silent', async () => {
      const w = await ready()
      await say(narratedTurn(1, { text: 'Not recorded.' }))
      expect(texts(w)).toEqual(['Not recorded.'])

      useGameStore().showModal = true
      await say(narratedTurn(2))
      expect(texts(w)).toHaveLength(3)
    })

    it('cuts in: a new answer completes the old one at once and is narrated', async () => {
      const w = await ready()
      await say(narratedTurn(1))
      await say(narratedTurn(2))

      expect(texts(w)).toEqual([FIRST, SECOND, FIRST])
    })

    it('hurries on a tap and skips on a second tap', async () => {
      const w = await ready()
      await say(narratedTurn(1))
      await w.get('.lq-story').trigger('click')
      await vi.advanceTimersByTimeAsync(80)
      expect(texts(w)).toEqual([FIRST, SECOND])
      await say(narratedTurn(2, { text: `${FIRST}\n${SECOND}\n${FIRST}` }))
      await w.get('.lq-story').trigger('click')
      await w.get('.lq-story').trigger('click')
      expect(texts(w)).toHaveLength(5)
      expect(useNarrationStore().isNarrating).toBe(false)
    })

    it('does not take a click on a name for a tap', async () => {
      const w = await ready()
      await say(narratedTurn(1, { text: `[item_name]${FIRST}[/item_name]` }))
      await w.get('.theme-item_name').trigger('click')
      expect(useNarrationStore().speaking(1)).not.toBeNull()
    })

    it('hurries with Space or Enter and skips with Escape, outside fields and menus', async () => {
      const w = await ready()
      await say(narratedTurn(1))
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
      )
      await vi.advanceTimersByTimeAsync(80)
      expect(texts(w)).toEqual([FIRST, SECOND])

      await say(narratedTurn(2))
      const field = document.createElement('input')
      field.setAttribute('aria-expanded', 'true')
      document.body.appendChild(field)
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      // An open word list takes the Escape to close itself.
      expect(useNarrationStore().isNarrating).toBe(true)
      field.remove()

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      expect(useNarrationStore().isNarrating).toBe(false)
      await vi.advanceTimersByTimeAsync(0)
      expect(texts(w)).toHaveLength(4)
    })

    it('skips with Escape in the command box when no word list is open, keeping the text', async () => {
      const w = await ready()
      await say(narratedTurn(1))
      const field = document.createElement('input')
      field.setAttribute('aria-expanded', 'false')
      field.value = 'talk to'
      document.body.appendChild(field)
      field.focus()
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      expect(useNarrationStore().isNarrating).toBe(false)
      await vi.advanceTimersByTimeAsync(0)
      expect(texts(w)).toHaveLength(2)
      expect(field.value).toBe('talk to')
      expect(document.activeElement).toBe(field)
      field.remove()
    })

    it('leaves Space and Enter to a focused button: it is pressed and the voice goes on', async () => {
      await ready()
      await say(narratedTurn(1))
      const button = document.createElement('button')
      document.body.appendChild(button)
      for (const key of [' ', 'Enter']) {
        const down = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        })
        button.dispatchEvent(down)
        expect(down.defaultPrevented).toBe(false)
        const up = new KeyboardEvent('keyup', {
          key,
          bubbles: true,
          cancelable: true,
        })
        button.dispatchEvent(up)
        expect(up.defaultPrevented).toBe(false)
      }
      expect(useNarrationStore().isNarrating).toBe(true)
      button.remove()
    })

    it('leaves Space and Enter to the command box', async () => {
      await ready()
      await say(narratedTurn(1))
      const field = document.createElement('input')
      document.body.appendChild(field)
      for (const key of [' ', 'Enter']) {
        const down = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        })
        field.dispatchEvent(down)
        expect(down.defaultPrevented).toBe(false)
      }
      expect(useNarrationStore().isNarrating).toBe(true)
      field.remove()
    })

    it('leaves Space and Enter to a button once nothing is being narrated', async () => {
      await ready()
      const button = document.createElement('button')
      document.body.appendChild(button)
      const down = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
      button.dispatchEvent(down)
      expect(down.defaultPrevented).toBe(false)
      button.remove()
    })

    it('does not narrate a turn that was already there when the story opened', async () => {
      vi.useFakeTimers()
      useGameStore().turns.push(narratedTurn(1))
      const w = mount(LanternLayout, { attachTo: document.body })
      wrapper = w
      useGameStore().actLabel = 'Act I'
      await vi.advanceTimersByTimeAsync(0)

      expect(texts(w)).toEqual([FIRST, SECOND])
      expect(useNarrationStore().isNarrating).toBe(false)
    })

    it('leaves Escape to the text-size popover and to a half-built command', async () => {
      const w = await ready()
      await say(narratedTurn(1))
      await w.get('button[aria-label="Text size"]').trigger('click')
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
      expect(useNarrationStore().isNarrating).toBe(true)
    })

    describe('pop-ups', () => {
      const CHAPTER = {
        kind: 'intro' as const,
        act: 'Act I',
        title: 'The Call',
        body: BODY,
      }

      async function openChapter(_w: VueWrapper): Promise<void> {
        const game = useGameStore()
        // Going on needs the engine; these tests are about the voice.
        vi.spyOn(game, 'continueChapter').mockImplementation(() => {})
        game.modalChapter = CHAPTER
        game.showModal = true
        await vi.advanceTimersByTimeAsync(0)
      }

      it('reads a chapter page: title first, then its paragraphs, until Continue', async () => {
        const w = await ready()
        await openChapter(w)
        expect(w.get('.lq-chapter-title').classes()).toContain('lq-speaking')
        expect(w.findAll('.lq-chapter-block')).toHaveLength(0)

        audios[0].onended?.()
        await vi.advanceTimersByTimeAsync(350)
        expect(w.findAll('.lq-chapter-block')).toHaveLength(0)
        await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
        expect(w.get('.lq-chapter-block').text()).toBe(BODY)
        expect(useNarrationStore().isNarrating).toBe(true)

        const pause = vi.spyOn(audios[1], 'pause')
        await w.get('.lq-chapter-button').trigger('click')
        expect(useNarrationStore().isNarrating).toBe(false)
        expect(pause).toHaveBeenCalled()
      })

      it('waits for the title page to go before reading the first chapter page', async () => {
        const w = await ready()
        const game = useGameStore()
        game.showTitle = true
        await openChapter(w)
        expect(useNarrationStore().isNarrating).toBe(false)
        game.showTitle = false
        await vi.advanceTimersByTimeAsync(0)
        expect(w.get('.lq-chapter-title').classes()).toContain('lq-speaking')
      })

      it('stops the voice when Escape goes on from a chapter page', async () => {
        const w = await ready()
        await openChapter(w)
        await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
        expect(useNarrationStore().isNarrating).toBe(false)
      })

      it('shows a chapter page whole when narration is off', async () => {
        const w = await ready()
        useSettingsStore().narrationOn = false
        await openChapter(w)
        expect(useNarrationStore().isNarrating).toBe(false)
        expect(w.findAll('.lq-chapter-block')).toHaveLength(1)
      })

      it('does not stall: a voice that never plays still lets the page move on', async () => {
        const w = await ready()
        await openChapter(w)
        await vi.advanceTimersByTimeAsync(20000)
        expect(w.findAll('.lq-chapter-block')).toHaveLength(1)
        await w.get('.lq-chapter-button').trigger('click')
        expect(useNarrationStore().isNarrating).toBe(false)
      })
    })

    it('stops when a pop-up opens', async () => {
      const w = await ready()
      await say(narratedTurn(1))
      useGameStore().showModal = true
      await vi.advanceTimersByTimeAsync(0)

      expect(useNarrationStore().isNarrating).toBe(false)
      expect(texts(w)).toEqual([FIRST, SECOND])
    })

    describe('the hint', () => {
      const TOUCH = 'Tap to hurry · double-tap to skip'
      const KEYS = 'Space to hurry · Esc to skip'
      const hint = (w: VueWrapper): string =>
        w.find('.lq-narration-hint').exists()
          ? w.get('.lq-narration-hint').text()
          : ''

      it('shows the touch wording on a phone or tablet, during a narrated turn', async () => {
        const w = await ready()
        expect(hint(w)).toBe('')
        await say(narratedTurn(1))
        expect(hint(w)).toBe(TOUCH)
      })

      it('shows the keyboard wording with a mouse and keyboard', async () => {
        vi.stubGlobal(
          'matchMedia',
          vi.fn((query: string) => ({
            matches: query.includes('pointer: fine'),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          })),
        )
        const w = await ready()
        await say(narratedTurn(1))
        expect(hint(w)).toBe(KEYS)
      })

      it('says only Esc to skip while the cursor is in the command box', async () => {
        vi.stubGlobal(
          'matchMedia',
          vi.fn((query: string) => ({
            matches: query.includes('pointer: fine'),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          })),
        )
        const w = await ready()
        await say(narratedTurn(1))
        const field = document.createElement('input')
        document.body.appendChild(field)
        field.className = 'lq-type-input'
        field.focus()
        await vi.advanceTimersByTimeAsync(0)
        expect(hint(w)).toBe('Esc to skip')
        field.blur()
        await vi.advanceTimersByTimeAsync(0)
        expect(hint(w)).toBe(KEYS)
        field.remove()
      })

      it('goes when the turn is skipped, and ends after three narrated turns', async () => {
        const w = await ready()
        for (const id of [1, 2, 3]) {
          await say(narratedTurn(id))
          expect(hint(w)).toBe(TOUCH)
          useNarrationStore().skipAll()
          await vi.advanceTimersByTimeAsync(0)
          expect(hint(w)).toBe('')
        }
        await say(narratedTurn(4))
        expect(useNarrationStore().isNarrating).toBe(true)
        expect(hint(w)).toBe('')
      })

      it('is not shown with narration off, and switching it off ends the turn', async () => {
        const w = await ready()
        await say(narratedTurn(1))
        useSettingsStore().narrationOn = false
        await vi.advanceTimersByTimeAsync(0)
        expect(hint(w)).toBe('')
        expect(useNarrationStore().isNarrating).toBe(false)
        expect(texts(w)).toEqual([FIRST, SECOND])
      })

      it('counts again in a new game', async () => {
        const w = await ready()
        for (const id of [1, 2, 3, 4]) await say(narratedTurn(id))
        expect(hint(w)).toBe('')
        useGameStore().gameNumber++
        await vi.advanceTimersByTimeAsync(0)
        await say(narratedTurn(5))
        expect(hint(w)).toBe(TOUCH)
      })
    })

    it('adds the narration entry to Help, before the music credits', async () => {
      const game = useGameStore()
      vi.spyOn(game, 'readInfo').mockReturnValue(
        '[bold]Available Commands:[/bold]',
      )
      // The credits show for a loaded track (jsdom's Audio has no playback).
      vi.stubGlobal(
        'Audio',
        class {
          paused = true
          play = (): Promise<void> => Promise.resolve()
          pause = (): void => undefined
          load = (): void => undefined
          removeAttribute = (): void => undefined
        },
      )
      const w = await ready()
      game.musicFile = 'market.mp3'
      game.musicInfo = 'Market by Conquest\nSource: https://freetouse.com/music'
      await w.get('button[aria-label="Game menu"]').trigger('click')
      const help = w
        .findAll('[role="dialog"] button')
        .find((b) => b.text().startsWith('Help'))!
      await help.trigger('click')

      const text = w.get('[role="dialog"]').text()
      expect(text).toContain(
        'Narration: tap the story or press Space to hurry the current line; ' +
          'double-tap or press Esc to show the rest at once. Any action cuts in. ' +
          'Turn narration off in Settings.',
      )
      expect(text.indexOf('Available Commands:')).toBeLessThan(
        text.indexOf('Narration:'),
      )
      expect(text.indexOf('Narration:')).toBeLessThan(
        text.indexOf('Market by Conquest'),
      )
    })
  })
})
