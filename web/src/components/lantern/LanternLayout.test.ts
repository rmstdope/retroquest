// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { GAME_NAME } from '@/engine'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import type { Turn } from '@/stores/useGameStore'
import type * as SceneMixModule from '@/lantern/sceneMix'
import type { SceneEntry } from '@/lantern/sceneMix'

/** Scenes whose mix a test gives in place of the committed one. */
const mixOf = vi.hoisted(() => ({}) as Record<string, SceneEntry>)
vi.mock('@/lantern/sceneMix', async (importOriginal) => {
  const actual = await importOriginal<typeof SceneMixModule>()
  return {
    ...actual,
    sceneMixOf: (scene: string): SceneEntry | undefined =>
      mixOf[scene] ?? actual.sceneMixOf(scene),
  }
})

/** Wait for the next animation frame (an open name menu listens for scrolls from then on). */
function nextFrame(): Promise<void> {
  return new Promise((done) => requestAnimationFrame(() => done()))
}

const TURN = {
  command: 'look',
  text: 'Hi',
  room: 'Square',
  description: null,
  gained: [],
  lost: [],
  arrival: null,
}

describe('LanternLayout', () => {
  let wrapper: VueWrapper | undefined

  // These tests read the text page, which a short screen (a phone on its side) keeps;
  // the picture stage on a phone has its own tests (LanternLayout.phone.test.ts).
  beforeEach(() => {
    setActivePinia(createPinia())
    // The game menu reads the quick save; these tests run with no game.
    vi.spyOn(useGameStore(), 'getQuickSave').mockReturnValue(null)
    vi.spyOn(useGameStore(), 'getNamedSaves').mockReturnValue([])
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('519px'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.unstubAllGlobals()
  })

  function mountLayout(options: { attachTo?: HTMLElement } = {}) {
    wrapper = mount(LanternLayout, options)
    return wrapper
  }

  /** A key pressed on the page: J the journal, Q the quests. */
  async function key(name: string): Promise<void> {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: name,
        bubbles: true,
        cancelable: true,
      }),
    )
    await flushPromises()
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

    it('does nothing on Escape: only its button goes on', async () => {
      const w = mountLayout()
      const game = useGameStore()
      const dismiss = vi
        .spyOn(game, 'continueChapter')
        .mockImplementation(() => {})
      game.modalChapter = INTRO
      game.showModal = true
      await w.vm.$nextTick()

      await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })

      expect(dismiss).not.toHaveBeenCalled()
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
      body: 'Congratulations — you have completed Act IV!',
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

    it('does not open the save dialog with Escape on the last chapter', async () => {
      const w = mountLayout()
      const game = useGameStore()
      game.modalChapter = FINAL
      game.showModal = true
      await w.vm.$nextTick()

      await w.get('.lq-chapter-dialog').trigger('keydown', { key: 'Escape' })

      expect(game.finishAsked).toBe(false)
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
    expect(w.get('h1').text()).toBe(`Thank you for playing ${GAME_NAME}`)
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
    await key('q')
    expect(w.get('[aria-label="Quests drawer"]').text()).toContain('Quests')

    useGameStore().gameNumber++
    await w.vm.$nextTick()

    expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
    vi.unstubAllGlobals()
  })

  it("shows a quest's details", async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.completedQuests = [
      {
        name: 'Hint of magic',
        main: false,
        done: true,
        details: { kind: 'journal', latest: 'You found it.', earlier: [] },
      },
    ]

    game.shownQuest = 'Hint of magic'
    await w.vm.$nextTick()

    const dialog = w.get('[role="dialog"]')
    expect(dialog.get('h2').text()).toBe('Hint of magic')
    expect(dialog.text()).toContain('Done')
    await dialog.get('button[aria-label="Close"]').trigger('click')
    expect(game.shownQuest).toBe(null)
  })

  it("closes a quest's details when a game pop-up opens", async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.activeQuests = [
      {
        name: 'Hint of magic',
        main: false,
        done: false,
        details: { kind: 'journal', latest: 'Look.', earlier: [] },
      },
    ]
    game.shownQuest = 'Hint of magic'
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
          description: null,
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
        'Use',
        'Open',
        'Close',
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
      const before = w.get('button[aria-label="Menu"]').element as HTMLElement
      before.focus()
      await w.get('.lq-story .theme-character_name').trigger('click')
      await flushPromises()

      await w.get('[role="menu"]').trigger('keydown', { key: 'Escape' })

      expect(w.find('[role="menu"]').exists()).toBe(false)
      // Focus goes back to where it was (a name in the text cannot take it).
      expect(document.activeElement).toBe(before)
    })

    it('goes back to what had focus, else to the typing box when it is up', async () => {
      const w = await storyWith('You see a [item_name]bucket[/item_name].')
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
      await flushPromises()
      const box = w.get('.lq-type-input').element
      const name = w.get('.lq-story .theme-item_name')
      const before = w.get('button[aria-label="Menu"]').element as HTMLElement
      before.focus()
      await name.trigger('click')
      await flushPromises()
      await w.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
      await flushPromises()
      expect(document.activeElement).toBe(before)

      // A mouse click on text leaves focus on the page.
      before.blur()
      await name.trigger('click')
      await flushPromises()
      await w.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
      await flushPromises()
      expect(document.activeElement).toBe(box)
    })

    it('gives the typing box the cursor after a picked action', async () => {
      const w = await storyWith('You see a [item_name]bucket[/item_name].')
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
      await flushPromises()
      vi.spyOn(useGameStore(), 'submitCommand').mockImplementation(() => {})
      const before = w.get('button[aria-label="Menu"]').element as HTMLElement
      before.focus()
      await w.get('.lq-story .theme-item_name').trigger('click')
      await flushPromises()
      await w.findAll('[role="menuitem"]')[0].trigger('click')
      await flushPromises()
      expect(document.activeElement).toBe(w.get('.lq-type-input').element)
    })

    it.each([
      ['a scroll', 'scroll'],
      ['a press outside it', 'pointerdown'],
    ])(
      'gives the typing box a cursor left on the page when %s closes the menu',
      async (_how, type) => {
        const w = await storyWith('You see a [item_name]bucket[/item_name].')
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
        await flushPromises()
        ;(document.activeElement as HTMLElement).blur()
        await w.get('.lq-story .theme-item_name').trigger('click')
        await flushPromises()
        await nextFrame()

        document.body.dispatchEvent(new Event(type, { bubbles: true }))
        await flushPromises()

        expect(w.find('[role="menu"]').exists()).toBe(false)
        expect(document.activeElement).toBe(w.get('.lq-type-input').element)
      },
    )

    it('leaves focus be when a scroll closes the menu', async () => {
      const w = await storyWith('You see a [item_name]bucket[/item_name].')
      ;(document.activeElement as HTMLElement | null)?.blur()
      await w.get('.lq-story .theme-item_name').trigger('click')
      await flushPromises()
      await nextFrame()

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
      await nextFrame()

      await w.get('.lq-story').trigger('scroll')

      expect(w.find('[role="menu"]').exists()).toBe(false)
      // The player scrolled away: focus goes back without moving the story.
      expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    })
  })

  it('lists no one and nothing in the laptop room card', async () => {
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
    game.items = ["Elior's Journal"]
    game.characters = ['grandmother']
    await flushPromises()
    const plate = wrapper.get('[aria-label="Current location"]')
    // The room's name is the one button on it: it opens Look, Search and Rest.
    expect(plate.findAll('button')).toHaveLength(1)
    expect(plate.text()).not.toContain('Journal')
    vi.unstubAllGlobals()
  })

  it('Continue on the title page loads the newest save and shows no chapter page', async () => {
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    vi.spyOn(game, 'getQuickSave').mockReturnValue(null)
    vi.spyOn(game, 'getNamedSaves').mockReturnValue([])
    vi.spyOn(game, 'getSaveSlots').mockReturnValue([
      {
        slot: 1,
        act: 'Act 1',
        room: 'Old Room',
        timestamp: '2026-11-01T10:00:00',
        quests: null,
      },
      {
        slot: 2,
        act: 'Act 2',
        room: 'The Old Mill',
        timestamp: '2026-11-03T21:14:00',
        quests: null,
      },
    ])
    const load = vi.spyOn(game, 'loadFromTitle').mockImplementation(() => {
      game.showTitle = false
      game.showModal = false
      game.modalChapter = null
      return true
    })
    game.modalChapter = {
      kind: 'intro',
      act: 'Act I',
      title: 'The Call to Adventure',
      body: 'You are Elior.',
    }
    game.showModal = true
    game.showTitle = true
    await flushPromises()

    const cont = wrapper.get('.lq-title-continue')
    expect(cont.get('.lq-continue-title').text()).toBe('The Old Mill')
    expect(cont.get('.lq-continue-line').text()).toContain('Act II · ')
    await cont.trigger('click')
    await flushPromises()

    expect(load).toHaveBeenCalledWith(2)
    expect(wrapper.find('.lq-title-page').exists()).toBe(false)
    expect(wrapper.find('.lq-chapter-button').exists()).toBe(false)
  })

  it('Continue loads the newest save by name when that is a named one', async () => {
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    vi.spyOn(game, 'getQuickSave').mockReturnValue(null)
    vi.spyOn(game, 'getSaveSlots').mockReturnValue(
      Array.from({ length: 8 }, (_, i) => ({
        slot: i + 1,
        act: null,
        room: null,
        timestamp: null,
        quests: null,
      })),
    )
    vi.spyOn(game, 'getNamedSaves').mockReturnValue([
      {
        slot: -1,
        name: 'before-the-mirrors',
        act: 'Act 3',
        room: 'Mount Ember',
        timestamp: '2026-11-03T21:14:00',
        quests: null,
      },
    ])
    const load = vi.spyOn(game, 'loadFromTitle').mockReturnValue(true)
    game.showTitle = true
    await flushPromises()

    const cont = wrapper.get('.lq-title-continue')
    expect(cont.get('.lq-continue-title').text()).toBe('Mount Ember')
    expect(cont.get('.lq-continue-line').text()).toMatch(
      /^before-the-mirrors · Act III · /,
    )
    expect(
      wrapper
        .findAll('.lq-title-second')
        .map((b) => b.text().replace(b.get('.lq-title-icon').text(), '')),
    ).toEqual(['New game', 'Load game'])
    await cont.trigger('click')

    expect(load).toHaveBeenCalledWith(-1, 'before-the-mirrors')
  })

  it('shows the title page over the first chapter, then the chapter', async () => {
    // The start is instant here: its fade has its own tests.
    useSettingsStore().reduceMotion = 'on'
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    game.modalChapter = {
      kind: 'intro',
      act: 'Act I',
      title: 'The Call to Adventure',
      body: 'You are Elior.',
    }
    game.showModal = true
    game.showTitle = true
    await flushPromises()
    // The opening is still playing: a press finishes it, then focus is on Start.
    await wrapper.get('.lq-title-page').trigger('pointerdown')
    await flushPromises()
    expect(document.activeElement?.textContent?.trim()).toBe('Start')

    await wrapper.get('.lq-title-start').trigger('pointerdown')
    await wrapper.get('.lq-title-start').trigger('click')
    await flushPromises()

    expect(wrapper.find('.lq-title-start').exists()).toBe(false)
    expect(document.activeElement?.className).toContain('lq-chapter-button')
  })

  it('asks before quitting', async () => {
    const w = mountLayout()

    useGameStore().quitAsked = true
    await w.vm.$nextTick()

    expect(w.get('[role="dialog"] h2').text()).toBe('Quit to the main menu?')
  })

  it('has no top bar: no title, no bar of buttons', () => {
    const w = mountLayout()
    expect(w.find('header').exists()).toBe(false)
    expect(w.text()).not.toContain(GAME_NAME)
  })

  it('lists the turns with their command and rendered answer', async () => {
    const w = mountLayout()
    useGameStore().turns = [
      {
        id: 1,
        command: null,
        text: 'You look around.',
        room: 'Square',
        description: { moved: true, firstVisit: false },
        gained: [],
        lost: [],
        arrival: null,
      },
      {
        id: 2,
        command: 'take bucket',
        text: '[item_name]Bucket[/item_name] taken.',
        room: 'Square',
        description: null,
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

  it('plays through the room name menu and the typing box', async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.acceptInput = true
    const submit = vi.spyOn(game, 'submitCommand').mockImplementation(() => {})
    await w.vm.$nextTick()

    expect(w.find('.lq-composer, .lq-dock').exists()).toBe(false)
    expect(w.find('.lq-type-input').exists()).toBe(false)
    await w.get('.lq-name-btn').trigger('click')
    await w.findAll('.lq-pill')[0].trigger('click')
    expect(submit).toHaveBeenCalledWith('look')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    await w.vm.$nextTick()
    await w.get('.lq-type-input').setValue('take bucket')
    await w.get('.lq-type-input').trigger('keydown', { key: 'Enter' })
    expect(submit).toHaveBeenCalledWith('take bucket')
  })

  it('returns focus to the typing box when the last pop-up closes', async () => {
    wrapper = mount(LanternLayout, { attachTo: document.body })
    const game = useGameStore()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    game.showModal = true
    await wrapper.vm.$nextTick()

    game.showModal = false
    game.acceptInput = true
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(wrapper.get('.lq-type-input').element)
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
      description: null,
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
        vi.fn((query: string) => ({
          // A laptop is not a phone (a touch screen).
          matches: !query.includes('hover: none'),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      )
    })

    afterEach(() => vi.unstubAllGlobals())

    it('plays the room on its picture: plate, buttons and story band, with no action bar', () => {
      useGameStore().roomName = 'Village Square'
      const w = mountLayout()

      expect(w.find('.lq-stage-picture').exists()).toBe(true)
      expect(w.get('[aria-label="Current location"]').text()).toContain(
        'Village Square',
      )
      expect(w.findAll('.lq-stage-btn').map((b) => b.text())).toEqual([
        '✎',
        '☰',
      ])
      expect(w.find('section[aria-label="Story"]').exists()).toBe(true)
      expect(w.find('section[aria-label="Actions"]').exists()).toBe(false)
      expect(w.find('.lq-composer, .lq-dock').exists()).toBe(false)
    })

    it('has no side column, and the map and the drawer start closed', () => {
      const w = mountLayout()

      expect(w.find('aside').exists()).toBe(false)
      expect(w.find('.lq-compass').exists()).toBe(false)
    })

    it('closes the drawer and the map after a load and in a new act', async () => {
      const w = mountLayout()
      const game = useGameStore()

      await key('q')
      game.loadNumber++
      await w.vm.$nextTick()
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)

      await key('q')
      game.musicActName = 'Act2'
      await w.vm.$nextTick()
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
    })

    describe('the story drawer', () => {
      const STORY = '[aria-label="Journal drawer"]'
      const stageTurns = () => {
        useGameStore().turns = [
          { ...TURN, id: 1, command: 'look' },
          { ...TURN, id: 2, command: 'take bread' },
        ]
      }

      it('opens on J with every turn, and closes on a second J', async () => {
        stageTurns()
        const w = mountLayout()
        await key('j')

        const drawer = w.get(STORY)
        expect(drawer.findAll('[data-testid="command"]')).toHaveLength(2)

        await key('j')
        expect(w.find(STORY).exists()).toBe(false)
      })

      it('closes with ✕ and Escape', async () => {
        const w = mountLayout()
        await key('j')
        await w.get(`${STORY} .lq-drawer-close`).trigger('click')
        expect(w.find(STORY).exists()).toBe(false)

        await key('j')
        await w.get(STORY).trigger('keydown', { key: 'Escape' })
        expect(w.find(STORY).exists()).toBe(false)
      })

      it('closes when a turn is played, and when the game is loaded', async () => {
        stageTurns()
        const w = mountLayout()
        const game = useGameStore()
        await key('j')
        game.turns = [...game.turns, { ...TURN, id: 3 }]
        await w.vm.$nextTick()
        expect(w.find(STORY).exists()).toBe(false)

        await key('j')
        game.loadNumber++
        await w.vm.$nextTick()
        expect(w.find(STORY).exists()).toBe(false)
      })

      it('is swapped for the Quests drawer by Open in journal', async () => {
        const w = mountLayout()
        await key('j')
        useGameStore().questToOpen = 'Whispers'
        await w.vm.$nextTick()
        expect(w.find(STORY).exists()).toBe(false)
        expect(w.get('[aria-label="Quests drawer"]').text()).toContain('Quests')
      })

      it('stays open for a press in the name menu', async () => {
        wrapper = mount(LanternLayout, { attachTo: document.body })
        const w = wrapper
        await key('j')
        const menu = document.createElement('div')
        menu.className = 'lq-name-menu'
        document.body.appendChild(menu)
        menu.dispatchEvent(new Event('pointerdown', { bubbles: true }))
        await w.vm.$nextTick()
        expect(w.find(STORY).exists()).toBe(true)
        menu.remove()
      })

      it('closes in a new game', async () => {
        const w = mountLayout()
        await key('j')
        useGameStore().gameNumber++
        await w.vm.$nextTick()
        expect(w.find(STORY).exists()).toBe(false)
      })

      it('follows the action row of a new game for its bottom edge', async () => {
        const observed: Element[] = []
        vi.stubGlobal(
          'ResizeObserver',
          class {
            observe(el: Element): void {
              observed.push(el)
            }
            unobserve(): void {}
            disconnect(): void {}
          },
        )
        const w = mountLayout()
        await flushPromises()
        const first = observed.at(-1)
        useGameStore().gameNumber++
        await flushPromises()
        const last = observed.at(-1)
        expect(last).toBeDefined()
        expect(last).not.toBe(first)
        w.unmount()
        wrapper = undefined
      })

      it('leaves the story band where it was', async () => {
        const w = mountLayout()
        const story = w.get('section[aria-label="Story"]').element
        story.scrollTop = 300
        await key('j')
        expect(story.scrollTop).toBe(300)
      })
    })
  })

  describe('speech on the picture, on a laptop', () => {
    const WORDS =
      '[character_name]Grandmother[/character_name]\n[dialogue]There you are.[/dialogue]'

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

    /** A player's command answered with `text`, addressed to `addressed`. */
    async function say(
      w: VueWrapper,
      text: string,
      addressed?: string,
      command = 'talk to grandmother',
    ): Promise<void> {
      const game = useGameStore()
      game.turns.push({
        ...TURN,
        id: (game.turns.at(-1)?.id ?? 0) + 1,
        command,
        text,
        ...(addressed ? { addressed } : {}),
      })
      await w.vm.$nextTick()
      await w.vm.$nextTick()
    }

    it('shows what the one spoken to says on the picture, leaving nothing on the left', async () => {
      const w = mountLayout()
      await say(w, WORDS, 'Grandmother')

      expect(w.get('.lq-line-right .lq-line-name').text()).toBe('Grandmother')
      expect(w.get('[data-testid="speech-line"]').text()).toContain(
        'There you are.',
      )
      const story = w.get('section[aria-label="Story"]').text()
      expect(story).not.toContain('› talk to grandmother')
      expect(story).not.toContain('There you are.')
    })

    it('clears the picture on another action, but not the story', async () => {
      const w = mountLayout()
      await say(w, WORDS, 'Grandmother')
      await say(w, 'You walk north.', undefined, 'go north')

      expect(w.find('[data-testid="speech-line"]').exists()).toBe(false)
      // The paper tells the current turn only; the earlier one stays in the story.
      expect(w.get('section[aria-label="Story"]').text()).toContain(
        'You walk north.',
      )
      expect(
        useGameStore().turns.some((t) => t.text.includes('There you are.')),
      ).toBe(true)
    })

    it('clears the picture after a load and in a new act', async () => {
      const w = mountLayout()
      const game = useGameStore()
      await say(w, WORDS, 'Grandmother')
      game.loadNumber++
      await w.vm.$nextTick()
      expect(w.find('[data-testid="speech-line"]').exists()).toBe(false)

      await say(w, WORDS, 'Grandmother')
      game.musicActName = 'Act2'
      await w.vm.$nextTick()
      expect(w.find('[data-testid="speech-line"]').exists()).toBe(false)
    })

    it('lets Escape close an open drawer and leaves the words alone', async () => {
      const w = mountLayout()
      await say(w, WORDS, 'Grandmother')
      await key('q')
      await w
        .get('[aria-label="Quests drawer"]')
        .trigger('keydown', { key: 'Escape' })
      expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
      expect(w.find('[data-testid="speech-line"]').exists()).toBe(true)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await w.vm.$nextTick()
      expect(
        w.get('[data-testid="speech-zone"]').attributes('inert'),
      ).toBeUndefined()
      expect(w.find('.lq-paper-tab').exists()).toBe(false)
    })
  })

  it('shows no speech on the picture on a short screen', async () => {
    const w = mountLayout()
    const game = useGameStore()
    game.turns.push({
      ...TURN,
      id: 1,
      command: 'talk to grandmother',
      text: '[character_name]Grandmother[/character_name]\n[dialogue]Hello.[/dialogue]',
      addressed: 'Grandmother',
    })
    await w.vm.$nextTick()
    expect(w.find('.lq-speech-zone').exists()).toBe(false)
    expect(w.get('section[aria-label="Story"]').text()).toContain('Hello.')
  })

  it('keeps the single column on a short screen', () => {
    const w = mountLayout()

    expect(w.find('aside').exists()).toBe(false)
    expect(w.find('.lq-stage').exists()).toBe(false)
  })

  describe('on a phone', () => {
    function stubScreen(short: boolean) {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: query.includes('519px') ? short : false,
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
      // Inside the document, so the stage's computed style counts.
      const w = mountLayout({ attachTo: document.body })

      // The plate on the picture names the room, so the header does not.
      expect(w.find('header .lq-compact-room').exists()).toBe(false)
      expect(sections(w).classes()).toContain('lq-nav-bottom')
      expect(sections(w).get('[aria-current="page"]').text()).toBe('Story')
      expect(w.get('.lq-stage').isVisible()).toBe(true)
    })

    it('shows the bag in place of the story and keeps the story', async () => {
      // Inside the document, so the story section's hidden parent counts:
      // an element outside it has no computed style (jsdom 31 and browsers).
      const w = mountLayout({ attachTo: document.body })
      // A story with a turn in it, since an empty one is not shown at all.
      useGameStore().turns = [{ ...TURN, id: 1 }]
      await w.vm.$nextTick()
      const story = () => w.get('section[aria-label="Story"]')
      expect(story().isVisible()).toBe(true)

      await open(w, 'Bag')

      expect(w.get('[aria-label="Journal"] h2').text()).toBe('Bag')
      expect(story().isVisible()).toBe(false)
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
          description: null,
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

      useGameStore().openQuestInJournal('Hint of magic')
      await flushPromises()

      expect(sections(w).get('[aria-current="page"]').text()).toMatch(/^Quests/)
    })

    describe("the menu's journey without the laptop stage", () => {
      const choose = async (w: VueWrapper, label: string): Promise<void> => {
        await w.get('.lq-float-menu').trigger('click')
        await w
          .get(`[role="dialog"] .lq-menu-journey[aria-label="${label}"]`)
          .trigger('click')
        await flushPromises()
      }
      const current = (w: VueWrapper): string =>
        sections(w).get('[aria-current="page"]').text()

      it('on a short screen (the text page) the tiles and keys switch the section, and Map opens the map', async () => {
        stubScreen(true)
        const w = mountLayout()
        await choose(w, 'Quests')
        expect(current(w)).toMatch(/^Quests/)
        expect(w.find('[role="dialog"]').exists()).toBe(false)
        await choose(w, 'Journal')
        expect(current(w)).toBe('Story')
        await key('q')
        expect(current(w)).toMatch(/^Quests/)
        await key('j')
        expect(current(w)).toBe('Story')
        await choose(w, 'Map')
        expect(w.get('[role="dialog"] h2').text()).toBe('Map')
      })

      it('on a tall screen Quests switches to its section and Journal opens the journal over the story', async () => {
        const w = mountLayout()
        await choose(w, 'Quests')
        expect(current(w)).toMatch(/^Quests/)
        expect(w.find('[aria-label="Quests drawer"]').exists()).toBe(false)
        await choose(w, 'Journal')
        expect(current(w)).toBe('Story')
        expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(true)
      })

      it('on a tall screen J from another section goes back to the story and opens the journal there', async () => {
        const w = mountLayout()
        await key('q')
        expect(current(w)).toMatch(/^Quests/)
        await key('j')
        expect(current(w)).toBe('Story')
        expect(w.find('[aria-label="Journal drawer"]').exists()).toBe(true)
      })
    })

    it('puts the section tabs on top of the page on a short screen, under the menu button', () => {
      stubScreen(true)
      const w = mountLayout()

      expect(w.find('header').exists()).toBe(false)
      expect(sections(w).classes()).toContain('lq-nav-top')
      expect(w.get('.lq-float-menu').attributes('aria-label')).toBe('Menu')
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
          description: null,
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
          unobserve() {}
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

    it('hands focus to the typing box when the pill goes at the end', async () => {
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const w = wrapper
      useGameStore().acceptInput = true
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
      await flushPromises()
      const { story } = stubStory(w, 2000)
      await addTurn(w)
      const pill = w.get('button.lq-more-below')
      ;(pill.element as HTMLElement).focus()

      story.scrollTop = 1700
      await w.get('section[aria-label="Story"]').trigger('scroll')

      expect(w.find('button.lq-more-below').exists()).toBe(false)
      expect(document.activeElement).toBe(w.get('.lq-type-input').element)
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

    it('opens the menu from ☰ on a tall stage', async () => {
      phone()
      const w = mountLayout()

      await w.get('button[aria-label="Menu"]').trigger('click')

      expect(w.get('[role="dialog"] h2').text()).toBe('Menu')
    })

    it('opens Help from the menu, comes back to the menu on ✕, and gives focus back to ☰ when the menu closes', async () => {
      phone()
      const game = useGameStore()
      vi.spyOn(game, 'readInfo').mockReturnValue(
        '[bold]Available Commands:[/bold]',
      )
      wrapper = mount(LanternLayout, { attachTo: document.body })
      const menuButton = wrapper.get('button[aria-label="Menu"]')
      ;(menuButton.element as HTMLElement).focus()
      await menuButton.trigger('click')
      await flushPromises()

      const help = wrapper
        .findAll('[role="dialog"] button')
        .find((b) => b.text() === 'Help')!
      await help.trigger('click')
      await flushPromises()

      const dialog = wrapper.get('[role="dialog"]')
      expect(dialog.get('h2').text()).toBe('Help')
      expect(dialog.text()).toContain('Available Commands:')
      expect(game.readInfo).toHaveBeenCalledWith('help')

      // ✕ returns to the menu, focus on the entry it came from.
      await dialog.get('button[aria-label="Close"]').trigger('click')
      await flushPromises()
      expect(wrapper.get('[role="dialog"] h2').text()).toBe('Menu')
      expect(document.activeElement?.textContent?.trim()).toBe('Help')

      await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
      await flushPromises()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(document.activeElement).toBe(menuButton.element)
    })

    it('opens Load game from the menu', async () => {
      phone()
      const game = useGameStore()
      vi.spyOn(game, 'getSaveSlots').mockReturnValue([])
      vi.spyOn(game, 'getQuickSave').mockReturnValue(null)
      vi.spyOn(game, 'getNamedSaves').mockReturnValue([])
      const w = mountLayout()

      await w.get('button[aria-label="Menu"]').trigger('click')
      await w
        .findAll('[role="dialog"] button')
        .find((b) => b.text() === 'Load')!
        .trigger('click')

      expect(w.get('[role="dialog"] h2').text()).toBe('Load game')
    })

    it('opens Settings from the menu', async () => {
      phone()
      const w = mountLayout()

      await w.get('button[aria-label="Menu"]').trigger('click')
      await w
        .findAll('[role="dialog"] button')
        .find((b) => b.text() === 'Settings')!
        .trigger('click')

      expect(w.get('[role="dialog"] h2').text()).toBe('Settings')
    })

    describe('Music credits for the track playing', () => {
      const MARKET = 'Conquest - Market (freetouse.com).mp3'

      /** Serves `takes` as the chosen-take list, with a silent stand-in for Audio. */
      function stubMusic(takes: unknown): void {
        vi.stubGlobal(
          'fetch',
          vi.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve(takes) }),
          ),
        )
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
      }

      /** Serves `takes` as the chosen-take list, plays Market in the square and opens Settings. */
      async function settingsWith(takes: unknown): Promise<string> {
        phone()
        stubMusic(takes)
        const w = mountLayout()
        const game = useGameStore()
        game.musicFile = MARKET
        game.musicInfo = 'Market by Conquest\nSource: https://freetouse.com'
        game.musicActName = 'Act1'
        game.musicRoomKey = 'VillageSquare'
        await flushPromises()
        await w.get('button[aria-label="Menu"]').trigger('click')
        await w
          .findAll('[role="dialog"] button')
          .find((b) => b.text() === 'Settings')!
          .trigger('click')
        return w.get('.lq-now-playing').text()
      }

      // The square plays what the game chooses, whatever music the committed mix names.
      beforeEach(() => {
        mixOf['act1-village-square'] = { effects: [] }
      })
      afterEach(() => {
        vi.unstubAllGlobals()
        delete mixOf['act1-village-square']
      })

      it('credits a studio take to Content Studio', async () => {
        const text = await settingsWith({
          'act1-village-square': { file: 'square.mp3', duration: 60 },
        })
        expect(text).toContain(`Original music for ${GAME_NAME}`)
        expect(text).not.toContain('Content Studio')
        expect(text).not.toContain('Audio Studio')
        expect(text).not.toContain('Conquest')
      })

      it("credits the game's own file when no take is chosen", async () => {
        const text = await settingsWith({})
        expect(text).toContain('Market by Conquest')
      })

      it('shows the one Content Studio credit on the title page, whatever music plays', async () => {
        stubMusic({ market: { file: 'market.mp3', duration: 60 } })
        const w = mountLayout()
        const game = useGameStore()
        game.musicFile = MARKET
        game.musicInfo = 'Market by Conquest\nSource: https://freetouse.com'
        game.showTitle = true
        await flushPromises()
        expect(w.get('.lq-credit').text()).toBe(
          'Original music, images and narration made with Content Studio',
        )
        expect(w.find('.lq-credits').exists()).toBe(false)
      })
    })

    it('closes the menu when a game pop-up opens', async () => {
      phone()
      const w = mountLayout()
      await w.get('button[aria-label="Menu"]').trigger('click')
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

    it('shows Help from the menu on a laptop', async () => {
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

      await w.get('button[aria-label="Menu"]').trigger('click')
      await w
        .findAll('[role="dialog"] button')
        .find((b) => b.text() === 'Help')!
        .trigger('click')

      expect(w.get('[role="dialog"] h2').text()).toBe('Help')
      expect(w.get('[role="dialog"]').text()).toContain('Available Commands:')
      expect(w.get('.lq-dialog-layer').classes()).toContain('lq-dialog-glass')
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
        description: null,
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
      vi.spyOn(useGameStore(), 'getQuickSave').mockReturnValue(null)
      vi.spyOn(useGameStore(), 'getNamedSaves').mockReturnValue([])
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
      const audio = {
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      }
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
      const audio = {
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      }
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
      useSettingsStore().narrationVolume = 0
      expect(held?.(narratedTurn(3))).toBe(true)
    })

    it('does not hold the act-complete page for an act with no recordings', async () => {
      const gate = vi.spyOn(useGameStore(), 'setActEndGate')
      await ready()
      vi.spyOn(useNarrationStore(), 'manifestFor').mockReturnValue({})
      const held = gate.mock.calls.at(-1)?.[0]
      expect(held?.(narratedTurn(1))).toBe(false)
    })

    it('shows a restored or opening turn at once, and tells a turn at narration volume 0 line by line', async () => {
      const w = await ready()
      await say(narratedTurn(1, { narrate: undefined }))
      expect(texts(w)).toEqual([FIRST, SECOND])

      useSettingsStore().narrationVolume = 0
      await say(narratedTurn(2))
      expect(useNarrationStore().isNarrating).toBe(true)
      expect(w.findAll('.lq-block-text')).toHaveLength(3)
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

    it('hurries on a tap, and a quick second tap does not skip', async () => {
      const w = await ready()
      await say(narratedTurn(1))
      await w.get('.lq-story').trigger('click')
      await vi.advanceTimersByTimeAsync(80)
      expect(texts(w)).toEqual([FIRST, SECOND])
      await say(narratedTurn(2, { text: `${FIRST}\n${SECOND}\n${FIRST}` }))
      await w.get('.lq-story').trigger('click')
      await w.get('.lq-story').trigger('click')
      expect(useNarrationStore().isNarrating).toBe(true)
    })

    it('does not take a click on a name for a tap', async () => {
      const w = await ready()
      await say(narratedTurn(1, { text: `[item_name]${FIRST}[/item_name]` }))
      await w.get('.theme-item_name').trigger('click')
      expect(useNarrationStore().speaking(1)).not.toBeNull()
    })

    it('hurries with Space or Enter, and Escape does not skip, outside fields and menus', async () => {
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
      expect(useNarrationStore().isNarrating).toBe(true)
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

    it('leaves Escape to a half-built command', async () => {
      await ready()
      await say(narratedTurn(1))
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

      it('does not hold the story under a chapter page', async () => {
        const w = await ready()
        await openChapter(w)
        const event = new WheelEvent('wheel', { cancelable: true, deltaY: 50 })
        w.get('section[aria-label="Story"]').element.dispatchEvent(event)
        expect(useNarrationStore().isNarrating).toBe(true)
        expect(event.defaultPrevented).toBe(false)
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

      it('leaves the voice on when Escape is pressed on a chapter page', async () => {
        const w = await ready()
        await openChapter(w)
        await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
        expect(useNarrationStore().isNarrating).toBe(true)
      })

      it('tells a chapter page the same way at narration volume 0', async () => {
        const w = await ready()
        useSettingsStore().narrationVolume = 0
        await openChapter(w)
        expect(useNarrationStore().isNarrating).toBe(true)
        expect(w.get('.lq-chapter-title').classes()).toContain('lq-speaking')
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

    describe('following the reading', () => {
      afterEach(() => {
        vi.restoreAllMocks()
      })

      const story = (w: VueWrapper): HTMLElement =>
        w.get('section[aria-label="Story"]').element as HTMLElement

      /** Give the story a 300px view of 2000px, and the lit word a place at `wordBottom`. */
      function stubGeometry(w: VueWrapper, wordBottom: number): void {
        const el = story(w)
        Object.defineProperty(el, 'clientHeight', {
          configurable: true,
          value: 300,
        })
        Object.defineProperty(el, 'scrollHeight', {
          configurable: true,
          value: 2000,
        })
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
          function (this: Element) {
            if (this === el) return { top: 0, bottom: 300 } as DOMRect
            if (this.classList.contains('lq-w-now'))
              return {
                top: wordBottom - 20 - el.scrollTop,
                bottom: wordBottom - el.scrollTop,
              } as DOMRect
            return { top: 0, bottom: 0 } as DOMRect
          },
        )
      }

      const wheel = (w: VueWrapper): WheelEvent => {
        const event = new WheelEvent('wheel', { cancelable: true, deltaY: 50 })
        story(w).dispatchEvent(event)
        return event
      }

      it('scrolls the story to keep the lit word two lines above the bottom', async () => {
        const w = await ready()
        stubGeometry(w, 600)
        await say(narratedTurn(1))
        audios[0].currentTime = 0.5
        await vi.advanceTimersByTimeAsync(200)
        // The story glides there.
        await vi.advanceTimersByTimeAsync(400)
        // jsdom has no line height: 16px text counts as 24px lines.
        expect(story(w).scrollTop).toBe(600 - 300 + 2 * 24)
      })

      it('brings the lit word back into view at once when the story changes size', async () => {
        const observed: Array<() => void> = []
        vi.stubGlobal(
          'ResizeObserver',
          class {
            constructor(cb: () => void) {
              observed.push(cb)
            }
            observe() {}
            unobserve() {}
            disconnect() {}
          },
        )
        const w = await ready()
        stubGeometry(w, 200)
        await say(narratedTurn(1))
        audios[0].currentTime = 0.5
        await vi.advanceTimersByTimeAsync(200)
        expect(story(w).scrollTop).toBe(0)

        Object.defineProperty(story(w), 'clientHeight', {
          configurable: true,
          value: 150,
        })
        observed.forEach((cb) => cb())
        // At once: no glide to wait for (jsdom lines are 24px).
        expect(story(w).scrollTop).toBe(200 - 150 + 2 * 24)
      })

      it('holds the story still while it is read, and frees it when the reading ends', async () => {
        const w = await ready()
        await say(narratedTurn(1))
        expect(wheel(w).defaultPrevented).toBe(true)
        useNarrationStore().skipAll()
        await vi.advanceTimersByTimeAsync(0)
        expect(wheel(w).defaultPrevented).toBe(false)
      })

      it('shows the hint for a scroll attempt in any turn', async () => {
        const w = await ready()
        for (const id of [1, 2, 3, 4]) await say(narratedTurn(id))
        expect(w.find('.lq-narration-hint').exists()).toBe(false)
        wheel(w)
        await vi.advanceTimersByTimeAsync(0)
        expect(w.find('.lq-narration-hint').exists()).toBe(true)
        await vi.advanceTimersByTimeAsync(2100)
        expect(w.find('.lq-narration-hint').exists()).toBe(false)
      })

      it('hides "More below" while it reads and brings it back after', async () => {
        const w = await ready()
        const el = story(w)
        Object.defineProperty(el, 'clientHeight', {
          configurable: true,
          value: 300,
        })
        Object.defineProperty(el, 'scrollHeight', {
          configurable: true,
          value: 2000,
        })
        await say(narratedTurn(1))
        await el.dispatchEvent(new Event('scroll'))
        await vi.advanceTimersByTimeAsync(0)
        expect(w.find('button.lq-more-below').exists()).toBe(false)
        useNarrationStore().skipAll()
        await vi.advanceTimersByTimeAsync(0)
        expect(w.find('button.lq-more-below').exists()).toBe(true)
      })

      it('shows "More below" when a skip draws the rest of the turn below the edge', async () => {
        const w = await ready()
        const el = story(w)
        Object.defineProperty(el, 'clientHeight', {
          configurable: true,
          value: 300,
        })
        // Everything fits until the skip draws the second line, far below.
        Object.defineProperty(el, 'scrollHeight', {
          configurable: true,
          get: () => (texts(w).includes(SECOND) ? 2000 : 300),
        })
        await say(narratedTurn(1))
        expect(texts(w)).toEqual([FIRST])
        useNarrationStore().skipAll()
        await vi.advanceTimersByTimeAsync(0)
        expect(texts(w)).toEqual([FIRST, SECOND])
        expect(w.find('button.lq-more-below').exists()).toBe(true)
      })

      it('shows the end of the story when a reading ending on a quest update has been read', async () => {
        const w = await ready()
        const el = story(w)
        // The lit word is near the end; the quest card, once drawn, adds 100px below it.
        stubGeometry(w, 1880)
        Object.defineProperty(el, 'scrollHeight', {
          configurable: true,
          get: () => (el.querySelector('[data-unit="2"]') ? 2000 : 1900),
        })
        useGameStore().setAudioPlayer({
          playNewQuest: vi.fn(),
          playQuestComplete: vi.fn(),
          playNewSpell: vi.fn(),
        })
        await say(
          narratedTurn(1, {
            quests: [
              {
                kind: 'updated',
                name: 'Q',
                main: false,
                text: 'Later.',
                chime: true,
              },
            ],
          }),
        )
        audios[0].onended?.()
        await vi.advanceTimersByTimeAsync(350)
        // A word of the last line is lit, then its voice ends.
        audios[1].currentTime = 0.5
        await vi.advanceTimersByTimeAsync(200)
        audios[1].onended?.()
        await vi.advanceTimersByTimeAsync(350)
        expect(useNarrationStore().storyReading).toBe(false)
        // jsdom fires no scroll event for a scroll made in code; a browser does.
        el.dispatchEvent(new Event('scroll'))
        await vi.advanceTimersByTimeAsync(0)
        expect(el.scrollTop).toBe(2000 - 300)
        expect(w.find('button.lq-more-below').exists()).toBe(false)
      })

      it('holds the story at narration volume 0 as with a voice', async () => {
        const w = await ready()
        useSettingsStore().narrationVolume = 0
        await say(narratedTurn(1))
        expect(useNarrationStore().isNarrating).toBe(true)
        expect(w.find('.lq-narration-hint').exists()).toBe(true)
      })
    })

    describe('the hint', () => {
      const TOUCH = 'Tap to hurry · hold to skip'
      const KEYS = 'Space to hurry · hold to skip'
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

      it('shows no hint while the cursor is in the command box', async () => {
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
        expect(w.find('.lq-narration-hint').exists()).toBe(false)
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

      it('stays up when the narration volume is turned to 0 during the turn', async () => {
        const w = await ready()
        await say(narratedTurn(1))
        useSettingsStore().narrationVolume = 0
        await vi.advanceTimersByTimeAsync(0)
        expect(hint(w)).toBe(TOUCH)
        expect(useNarrationStore().isNarrating).toBe(true)
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
      await w.get('button[aria-label="Menu"]').trigger('click')
      const help = w
        .findAll('[role="dialog"] button')
        .find((b) => b.text().startsWith('Help'))!
      await help.trigger('click')

      const text = w.get('[role="dialog"]').text()
      expect(text).toContain(
        'Narration: Tap the story or press Space to hurry the current line; ' +
          'hold to show the rest at once. Any action cuts in. ' +
          'Set its volume, down to silent, in Settings.',
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
