// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import { arrivalBlocks } from '@/lantern/narrationScript'
import { SCENE_PAUSE_MS } from '@/lantern/narrationUnits'
import { ARRIVAL_CLEAR_AFTER_MS } from '@/lantern/stageArrival'
import { startedHoldStore } from '@/testing/holdGame'

const GARDEN = arrivalBlocks('Garden', 'A green garden.')

/**
 * The arrival told on the room's picture (laptop stage), over the real
 * engine: the first visit, with and without narration, and what steps it aside.
 */
describe('LanternLayout: the arrival on the picture', () => {
  let wrapper: VueWrapper | undefined
  /** This test's own pinia: a store of an earlier test acting late must not take its place. */
  let pinia: Pinia
  const audios: NarrationAudio[] = []
  /** The "change" listeners of the wide-screen query, to turn the window. */
  let wideChanges: ((event: { matches: boolean }) => void)[] = []

  /** Mount the layout on a wide screen (or a phone); `recorded` gives the garden's lines a voice. */
  async function ready(
    wide: boolean | 'short' = true,
    recorded = true,
  ): Promise<VueWrapper> {
    vi.useFakeTimers()
    wideChanges = []
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches:
          wide === 'short'
            ? query.includes('max-height')
            : wide && query.includes('min-width'),
        addEventListener: vi.fn((_type: string, listener: never) => {
          if (query.includes('min-width')) wideChanges.push(listener)
        }),
        removeEventListener: vi.fn(),
      })),
    )
    const manifest = recorded
      ? Object.fromEntries(
          GARDEN.map(({ speaker, markup }) => [
            narrationKey(speaker, markup),
            {
              file: 'x.mp3',
              speaker,
              duration: 5,
              words: narrationWords(markup).map((word, i) => ({
                word,
                start: i,
                end: i + 1,
              })),
            },
          ]),
        )
      : {}
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => manifest })),
    )
    useNarrationStore(pinia).setAudioFactory((): NarrationAudio => {
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
    const game = await startedHoldStore(pinia)
    game.actLabel = 'Act I'
    game.dismissTitle()
    wrapper = mount(LanternLayout, {
      attachTo: document.body,
      global: { plugins: [pinia] },
    })
    await vi.advanceTimersByTimeAsync(0)
    return wrapper
  }

  /** Run a command and let the layout start the arrival. */
  async function run(command: string): Promise<void> {
    useGameStore(pinia).submitCommand(command)
    await vi.advanceTimersByTimeAsync(0)
  }

  const card = (w: VueWrapper): string =>
    w.find('.lq-arrival-card').exists() ? w.get('.lq-arrival-card').text() : ''
  const storyAside = (w: VueWrapper): boolean =>
    w.get('.lq-story-wrap').classes().includes('lq-paper-away')
  const key = async (name: string): Promise<void> => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, bubbles: true }),
    )
    await vi.advanceTimersByTimeAsync(0)
  }

  beforeEach(() => {
    audios.length = 0
    pinia = createPinia()
    setActivePinia(pinia)
    try {
      localStorage.clear()
    } catch {
      // No storage in this environment.
    }
    useSettingsStore(pinia).narrationOn = true
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('tells a first visit on the picture, with the story aside and neither Hide nor tab', async () => {
    const w = await ready()
    await run('go north')
    expect(card(w)).toContain('A green garden.')
    expect(card(w)).toContain('Click or press Enter to continue')
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(false)
    expect(storyAside(w)).toBe(true)
    // Both sides are clear, so there is nothing to hide or show.
    expect(w.find('.lq-paper-tab').exists()).toBe(false)
    expect(w.find('.lq-words-hide').exists()).toBe(false)
  })

  it('clears 1½ s after the narrator finishes, and the cards come back with a slim card for the walk', async () => {
    const w = await ready()
    await run('go north')
    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(350)
    audios[1].onended?.()
    await vi.advanceTimersByTimeAsync(ARRIVAL_CLEAR_AFTER_MS - 1)
    expect(card(w)).not.toBe('')
    await vi.advanceTimersByTimeAsync(1)
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
    expect(w.find('.lq-paper-tab').exists()).toBe(false)
    // The room was told in the middle: the card keeps only the command.
    expect(w.get('.lq-story').text()).toContain('› go north')
    expect(w.get('.lq-story').text()).not.toContain('A green garden.')
  })

  it('reads it for its reading time with a bar when narration is off', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    expect(card(w)).toContain('A green garden.')
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(5999)
    expect(card(w)).not.toBe('')
    await vi.advanceTimersByTimeAsync(1)
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
  })

  it('does the same when the room has no recording yet', async () => {
    const w = await ready(true, false)
    await run('go north')
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(true)
  })

  it('goes on with Enter, and clears on the last part, stopping the narrator', async () => {
    const w = await ready()
    await run('go north')
    expect(useNarrationStore(pinia).isNarrating).toBe(true)
    await key('Enter')
    expect(card(w)).toBe('')
    expect(useNarrationStore(pinia).isNarrating).toBe(false)
    expect(storyAside(w)).toBe(false)
  })

  it('goes on with a click on the picture', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    await w.get('[data-testid="arrival-on-picture"]').trigger('click')
    expect(card(w)).toBe('')
  })

  it('goes on with Enter or Space from a focused verb, without pressing it', async () => {
    const w = await ready()
    await run('go north')
    const turns = useGameStore(pinia).turns.length
    const verb = w.get('[data-verb="look"]').element as HTMLElement
    verb.focus()
    const down = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    verb.dispatchEvent(down)
    await vi.advanceTimersByTimeAsync(0)
    expect(down.defaultPrevented).toBe(true)
    expect(card(w)).toBe('')
    expect(document.activeElement).toBe(verb)
    expect(useGameStore(pinia).turns).toHaveLength(turns)
  })

  it('goes on with Enter in the empty command box, whose own handler has already taken the key', async () => {
    useSettingsStore(pinia).startMode = 'type'
    const w = await ready()
    await run('go north')
    const turns = useGameStore(pinia).turns.length
    const input = w.get('.lq-type-input').element as HTMLInputElement
    input.focus()
    const down = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(down)
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
    expect(useGameStore(pinia).turns).toHaveLength(turns)
  })

  it('goes on with Space from a focused verb, and swallows its key-up', async () => {
    const w = await ready()
    await run('go north')
    const verb = w.get('[data-verb="look"]').element as HTMLElement
    verb.focus()
    const down = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    verb.dispatchEvent(down)
    const up = new KeyboardEvent('keyup', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    verb.dispatchEvent(up)
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
    expect(up.defaultPrevented).toBe(true)
  })

  it('clears with Escape', async () => {
    const w = await ready()
    await run('go north')
    await key('Escape')
    expect(card(w)).toBe('')
    expect(useNarrationStore(pinia).isNarrating).toBe(false)
    expect(storyAside(w)).toBe(false)
  })

  it('clears with the Narration tab on a phone', async () => {
    const w = await ready(false)
    await run('go north')
    await w.get('.lq-paper-tab').trigger('click')
    expect(card(w)).toBe('')
    expect(useNarrationStore(pinia).isNarrating).toBe(false)
  })

  it('clears when an action is chosen', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    await w.get('[data-verb="take"]').trigger('click')
    expect(card(w)).toBe('')
  })

  it('clears when the player types, and the command still goes through', async () => {
    useSettingsStore(pinia).startMode = 'type'
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    expect(card(w)).not.toBe('')
    const input = w.get('.lq-type-input')
    await input.setValue('inventory')
    expect(card(w)).toBe('')
    await input.trigger('keydown', { key: 'Enter' })
    expect(useGameStore(pinia).turns.at(-1)?.command).toBe('inventory')
  })

  it('keeps to its own stores when a store of an earlier test acts late', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    // A leftover callback of an earlier test's store sets its pinia active.
    useGameStore(createPinia())
    await run('go north')
    expect(card(w)).toContain('A green garden.')
  })

  it('clears for the next command', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    await run('inventory')
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
  })

  it('does not tell a room already visited, nor a look', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('look')
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
    await run('go north')
    await key('Escape')
    await run('go south')
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
  })

  it('tells the arrival on a phone too, with its own hint', async () => {
    const w = await ready(false)
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    expect(card(w)).toContain('Tap to continue')
    expect(w.get('[data-testid="arrival-on-picture"]').classes()).toContain(
      'lq-phone-arrival',
    )
  })

  it('leaves a short screen as it was', async () => {
    const w = await ready('short')
    await run('go north')
    expect(card(w)).toBe('')
    expect(w.find('.lq-paper-tab').exists()).toBe(false)
    expect(w.find('[data-testid="arrival-on-picture"]').exists()).toBe(false)
  })

  it('clears when the window turns into a phone', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    expect(card(w)).not.toBe('')
    wideChanges.forEach((change) => change({ matches: false }))
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
  })

  it('tells what happens on arrival first, in italics, then the description, and then the quest news', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    useGameStore(pinia).turns.push({
      id: 99,
      command: 'south',
      text: 'A man leaves.',
      room: 'Mill',
      description: { moved: true, firstVisit: true },
      gained: [],
      lost: [],
      arrival: {
        room: 'Mill',
        description: 'A creaky windmill.',
        characters: [],
        items: [],
        exits: {},
      },
      quests: [{ kind: 'new', name: 'Q', main: false, text: 'Go.' }],
      narrate: true,
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toContain('A man leaves.')
    expect(w.get('.lq-arrival-line').classes()).toContain('lq-arrival-event')
    await w.get('[data-testid="arrival-on-picture"]').trigger('click')
    expect(card(w)).toContain('A creaky windmill.')
    expect(card(w)).not.toContain('Go.')
    await w.get('[data-testid="arrival-on-picture"]').trigger('click')
    expect(card(w)).toContain('New side quest')
    expect(card(w)).toContain('Go.')
    await w.get('[data-testid="arrival-on-picture"]').trigger('click')
    expect(card(w)).toBe('')
    expect(w.get('.lq-story').text()).toContain('New side quest · Q')
  })

  describe('quest news', () => {
    const news = (id = 90): Parameters<typeof pushTurn>[0] => ({
      id,
      command: 'talk to grandmother',
      text: 'She smiles.',
      quests: [
        {
          kind: 'completed',
          name: 'Hint of Magic',
          main: false,
          text: 'It stayed.',
          progress: { completed: 1, total: 11 },
          fanfare: true,
        },
        {
          kind: 'updated',
          name: 'The cat',
          main: false,
          text: 'Later.',
          chime: true,
        },
      ],
    })
    /** Push a turn with no room onto the game. */
    function pushTurn(turn: {
      id: number
      command: string
      text: string
      quests: NonNullable<Turn['quests']>
    }): void {
      useGameStore(pinia).turns.push({
        room: 'Square',
        description: null,
        gained: [],
        lost: [],
        arrival: null,
        ...turn,
      })
    }

    it('is told in the middle, one piece after the other, then leaves slim lines on the card', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationOn = false
      const audio = {
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      }
      useGameStore(pinia).setAudioPlayer(audio)
      pushTurn(news())
      await vi.advanceTimersByTimeAsync(0)
      expect(card(w)).toContain('Side quest complete · 1 of 11')
      expect(card(w)).toContain('Hint of Magic')
      expect(storyAside(w)).toBe(true)
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      expect(audio.playNewQuest).not.toHaveBeenCalled()
      await w.get('[data-testid="arrival-on-picture"]').trigger('click')
      expect(card(w)).toContain('Quest updated')
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      await w.get('[data-testid="arrival-on-picture"]').trigger('click')
      expect(card(w)).toBe('')
      expect(storyAside(w)).toBe(false)
      const lines = w.findAll('[data-testid="news-line"]')
      expect(lines).toHaveLength(2)
      expect(lines[0].text()).toContain('Side quest complete · Hint of Magic')
      expect(lines[1].text()).toContain('Quest updated · The cat')
    })

    it('goes on with Space, and Enter after the last piece clears it', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationOn = false
      useGameStore(pinia).setAudioPlayer({
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      })
      pushTurn(news())
      await vi.advanceTimersByTimeAsync(0)
      expect(card(w)).toContain('Hint of Magic')
      await key(' ')
      expect(card(w)).toContain('Quest updated')
      await key('Enter')
      expect(card(w)).toBe('')
    })

    it('ends all the news of the turn with Escape', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationOn = false
      useGameStore(pinia).setAudioPlayer({
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      })
      pushTurn(news())
      await vi.advanceTimersByTimeAsync(0)
      await key('Escape')
      expect(card(w)).toBe('')
      expect(w.findAll('[data-testid="news-line"]')).toHaveLength(2)
    })

    it('opens the journal at the quest from its slim line', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationOn = false
      const game = useGameStore(pinia)
      game.setAudioPlayer({
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      })
      const open = vi.spyOn(game, 'openQuestInJournal')
      pushTurn(news())
      await vi.advanceTimersByTimeAsync(0)
      await key('Escape')
      await w.findAll('[data-testid="news-line"] button')[0].trigger('click')
      expect(open).toHaveBeenCalledWith('Hint of Magic')
    })
  })

  it('shows a turn that is not narrated and has no room as it is', async () => {
    const w = await ready()
    useGameStore(pinia).turns.push({
      id: 98,
      command: null,
      text: 'The heart of Willowbrook.',
      room: 'Square',
      gained: [],
      lost: [],
    } as never)
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
    expect(w.get('.lq-story').text()).toContain('The heart of Willowbrook.')
  })

  it('keeps the paper away and inert only while the arrival is told', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    expect(w.get('.lq-story-wrap').attributes('inert')).toBeDefined()
    await key('Escape')
    expect(w.get('.lq-story-wrap').attributes('inert')).toBeUndefined()
  })

  it('ignores N during an arrival, which has neither Hide nor tab to offer it', async () => {
    const w = await ready()
    await run('go north')
    expect(w.find('.lq-paper-tab').exists()).toBe(false)
    await key('n')
    expect(card(w)).not.toBe('')
    expect(storyAside(w)).toBe(true)
  })

  it('clears when narration is switched off while it is told', async () => {
    const w = await ready()
    await run('go north')
    expect(card(w)).not.toBe('')
    useSettingsStore(pinia).narrationOn = false
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
  })

  it('lets Enter press the Narration tab on a phone, which clears the arrival and takes focus to Hide', async () => {
    const w = await ready(false)
    useSettingsStore(pinia).narrationOn = false
    useGameStore(pinia).turns.push({
      id: 96,
      command: 'south',
      text: 'A man leaves.',
      room: 'Garden',
      description: { moved: true, firstVisit: true },
      gained: [],
      lost: [],
      arrival: {
        room: 'Garden',
        description: 'A green garden.',
        characters: [],
        items: [],
        exits: {},
      },
      narrate: true,
    })
    await vi.advanceTimersByTimeAsync(0)
    const tab = w.get('.lq-paper-tab').element as HTMLElement
    tab.focus()
    const down = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    tab.dispatchEvent(down)
    // Not taken as "go on": the button itself is pressed (a click follows).
    expect(down.defaultPrevented).toBe(false)
    expect(card(w)).toContain('A man leaves.')
    await w.get('.lq-paper-tab').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
    expect(document.activeElement).toBe(w.get('.lq-paper-corner').element)
  })

  it('moves focus from the tab to Hide when the arrival ends by itself, on a phone', async () => {
    const w = await ready(false)
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    ;(w.get('.lq-paper-tab').element as HTMLElement).focus()
    await vi.advanceTimersByTimeAsync(6000)
    expect(card(w)).toBe('')
    expect(document.activeElement).toBe(w.get('.lq-paper-corner').element)
  })

  it('moves focus from the paper to the tab when an arrival starts, on a phone', async () => {
    const w = await ready(false)
    useSettingsStore(pinia).narrationOn = false
    ;(w.get('.lq-paper-corner').element as HTMLElement).focus()
    await run('go north')
    expect(document.activeElement).toBe(w.get('.lq-paper-tab').element)
  })

  it('does not let a held key run through the parts', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        repeat: true,
        bubbles: true,
      }),
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).not.toBe('')
  })

  it('clears for a new game and a new act', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    useGameStore(pinia).gameNumber++
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
    await run('go south')
    await run('go north')
  })

  it('reads silent events for their reading time before the narrator tells the description', async () => {
    const w = await ready()
    useGameStore(pinia).turns.push({
      id: 97,
      command: 'south',
      text: 'A man leaves.',
      room: 'Garden',
      description: { moved: true, firstVisit: true },
      gained: [],
      lost: [],
      arrival: {
        room: 'Garden',
        description: 'A green garden.',
        characters: [],
        items: [],
        exits: {},
      },
      narrate: true,
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toContain('A man leaves.')
    await vi.advanceTimersByTimeAsync(5900)
    expect(card(w)).toContain('A man leaves.')
    await vi.advanceTimersByTimeAsync(200)
    expect(card(w)).toContain('A green garden.')
    expect(card(w)).not.toContain('A man leaves.')
  })

  it('shows the room clear after a load', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationOn = false
    await run('go north')
    useGameStore(pinia).loadNumber++
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await vi.waitFor(() => expect(card(w)).toBe(''))
    expect(useArrivalStore(pinia).active).toBe(false)
  })

  describe('spell news', () => {
    const LEARNED = 'You have learned [spell_name]revive[/spell_name].'
    const spell = { name: 'Revive', text: 'Calls a thing back.' }
    /** A turn that taught a spell and finished a quest. */
    function pushSpellTurn(): void {
      useGameStore(pinia).turns.push({
        id: 90,
        command: 'talk to grandmother',
        text: `She smiles.\n${LEARNED}`,
        room: 'Square',
        description: null,
        gained: [],
        lost: [],
        arrival: null,
        spells: [spell],
        quests: [
          {
            kind: 'completed',
            name: 'Hint of Magic',
            main: false,
            text: 'It stayed.',
            progress: { completed: 1, total: 11 },
            fanfare: true,
          },
        ],
      })
    }

    it('is told before the quest news, with its sound, and the card never carries the learned line', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationOn = false
      const game = useGameStore(pinia)
      const audio = {
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      }
      game.setAudioPlayer(audio)
      pushSpellTurn()
      await vi.advanceTimersByTimeAsync(0)
      expect(card(w)).toContain('New spell')
      expect(card(w)).toContain('Revive')
      expect(card(w)).toContain('Calls a thing back.')
      expect(audio.playNewSpell).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
      await w.get('[data-testid="arrival-on-picture"]').trigger('click')
      expect(card(w)).toContain('Side quest complete')
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      await w.get('[data-testid="arrival-on-picture"]').trigger('click')
      expect(card(w)).toBe('')
      expect(w.get('.lq-story').text()).toContain('She smiles.')
      expect(w.get('.lq-story').text()).not.toContain('You have learned')
      expect(game.turns.at(-1)?.fullText).toContain('You have learned')
    })

    it('leaves the line on the card where nothing is told in the middle', async () => {
      const w = await ready('short', false)
      useSettingsStore(pinia).narrationOn = false
      useGameStore(pinia).setAudioPlayer({
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      })
      pushSpellTurn()
      await vi.advanceTimersByTimeAsync(0)
      expect(card(w)).toBe('')
      expect(w.get('.lq-story').text()).toContain('You have learned')
    })
  })
})
