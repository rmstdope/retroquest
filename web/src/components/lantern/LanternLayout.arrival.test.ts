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
    wide: boolean | 'short' | 'sideways' = true,
    recorded = true,
  ): Promise<VueWrapper> {
    vi.useFakeTimers()
    wideChanges = []
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches:
          wide === 'short'
            ? query.includes('519px')
            : wide === 'sideways'
              ? query.includes('hover: none') ||
                query.includes('orientation: landscape')
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
  /** The story is slid aside for the arrival (the class; an empty paper is not shown at all). */
  const slidAside = (w: VueWrapper): boolean =>
    w.get('.lq-story-wrap').classes().includes('lq-paper-away')
  /** The story is out of the way: slid aside, or not shown at all (nothing on it). */
  const storyAside = (w: VueWrapper): boolean => {
    const wrap = w.get('.lq-story-wrap')
    return (
      wrap.classes().includes('lq-paper-away') ||
      (wrap.element as HTMLElement).style.display === 'none'
    )
  }
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
    expect(card(w)).toContain('Click to continue · Hold to skip')
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(false)
    expect(storyAside(w)).toBe(true)
    // Both sides are clear, so there is nothing to hide or show.
    expect(w.find('.lq-paper-tab').exists()).toBe(false)
    expect(w.find('.lq-words-hide').exists()).toBe(false)
  })

  it('clears 1½ s after the narrator finishes, leaving nothing of the walk on the left', async () => {
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
    expect(slidAside(w)).toBe(false)
    expect(w.find('.lq-paper-tab').exists()).toBe(false)
    // The room was told in the middle, and the command is not echoed.
    expect(w.get('.lq-story').text()).not.toContain('› go north')
    expect(w.get('.lq-story').text()).not.toContain('A green garden.')
  })

  it('reads it for its reading time with a bar when the room has no recording yet', async () => {
    const w = await ready(true, false)
    await run('go north')
    expect(card(w)).toContain('A green garden.')
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(5999)
    expect(card(w)).not.toBe('')
    await vi.advanceTimersByTimeAsync(1)
    expect(card(w)).toBe('')
    expect(slidAside(w)).toBe(false)
  })

  it('goes on with a click on the picture', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationVolume = 0
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
    expect(slidAside(w)).toBe(false)
  })

  it('shows neither Hide nor Show while the arrival is told on a phone', async () => {
    const w = await ready(false)
    useSettingsStore(pinia).narrationVolume = 0
    await run('go north')
    expect(w.find('.lq-words-hide').exists()).toBe(false)
    expect(w.find('.lq-paper-tab').exists()).toBe(false)
  })

  it('clears when the player types, and the command still goes through', async () => {
    useSettingsStore(pinia).startMode = 'type'
    const w = await ready()
    useSettingsStore(pinia).narrationVolume = 0
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
    useSettingsStore(pinia).narrationVolume = 0
    // A leftover callback of an earlier test's store sets its pinia active.
    useGameStore(createPinia())
    await run('go north')
    expect(card(w)).toContain('A green garden.')
  })

  it('clears for the next command', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationVolume = 0
    await run('go north')
    await run('inventory')
    expect(card(w)).toBe('')
    expect(slidAside(w)).toBe(false)
  })

  it('does not tell a room already visited, nor a look', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationVolume = 0
    await run('look')
    expect(card(w)).toBe('')
    expect(slidAside(w)).toBe(false)
    await run('go north')
    await key('Escape')
    await run('go south')
    expect(card(w)).toBe('')
    expect(slidAside(w)).toBe(false)
  })

  it('tells the arrival on a sideways phone with the sideways card (rq-dpom)', async () => {
    const w = await ready('sideways')
    useSettingsStore(pinia).narrationVolume = 0
    await run('go north')
    expect(card(w)).toContain('Tap to continue · Hold to skip')
    const classes = w.get('[data-testid="arrival-on-picture"]').classes()
    expect(classes).toContain('lq-sideways-arrival')
    expect(classes).not.toContain('lq-phone-arrival')
  })

  it('clears when the window turns into a phone', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationVolume = 0
    await run('go north')
    expect(card(w)).not.toBe('')
    wideChanges.forEach((change) => change({ matches: false }))
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
  })

  it('tells what happens on arrival first, in italics, then the description, and then the quest news', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationVolume = 0
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
    // The news was told in the middle: it leaves no line on the left.
    expect(w.get('.lq-story').text()).not.toContain('New side quest')
  })

  describe('quest news', () => {
    const news = (id = 90): Parameters<typeof pushTurn>[0] => ({
      id,
      command: 'talk to grandmother',
      text: 'She smiles.',
      quests: [
        {
          kind: 'completed',
          name: 'Hint of magic',
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
      narrate?: true
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

    it('is told in the middle, one piece after the other, and leaves no line on the left', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationVolume = 0
      const audio = {
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      }
      useGameStore(pinia).setAudioPlayer(audio)
      pushTurn(news())
      await vi.advanceTimersByTimeAsync(0)
      expect(card(w)).toContain('Side quest complete · 1 of 11')
      expect(card(w)).toContain('Hint of magic')
      expect(storyAside(w)).toBe(true)
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
      expect(audio.playNewQuest).not.toHaveBeenCalled()
      await w.get('[data-testid="arrival-on-picture"]').trigger('click')
      expect(card(w)).toContain('Quest updated')
      expect(audio.playNewQuest).toHaveBeenCalledOnce()
      await w.get('[data-testid="arrival-on-picture"]').trigger('click')
      expect(card(w)).toBe('')
      expect(slidAside(w)).toBe(false)
      expect(w.findAll('[data-testid="news-line"]')).toHaveLength(0)
      expect(w.get('.lq-story').text()).not.toContain('Hint of magic')
    })

    it('rings the sounds of a turn whose news still waits for the narrator when the player moves on, leaving no line', async () => {
      const w = await ready(true, true)
      const audio = {
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      }
      useGameStore(pinia).setAudioPlayer(audio)
      pushTurn({ ...news(), text: 'A green garden.', narrate: true })
      await vi.advanceTimersByTimeAsync(0)
      // The narrator is still on the words: nothing of the news is up.
      expect(card(w)).toBe('')
      expect(w.findAll('[data-testid="news-line"]')).toHaveLength(0)
      await run('look')
      expect(w.findAll('[data-testid="news-line"]')).toHaveLength(0)
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
    })

    it('keeps the narrator and the waiting news while the player types ahead in the command box', async () => {
      const w = await ready(true, true)
      useGameStore(pinia).setAudioPlayer({
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      })
      pushTurn({ ...news(), text: 'A green garden.', narrate: true })
      await vi.advanceTimersByTimeAsync(0)
      const narration = useNarrationStore(pinia)
      expect(narration.narrates(90)).toBe(true)
      expect(useArrivalStore(pinia).newsPending(90)).toBe(true)
      await w.get('.lq-composer').trigger('input')
      await w.get('.lq-composer').trigger('click')
      expect(narration.narrates(90)).toBe(true)
      expect(useArrivalStore(pinia).newsPending(90)).toBe(true)
      expect(w.findAll('[data-testid="news-line"]')).toHaveLength(0)
    })

    it('goes on with Space, and Enter after the last piece clears it', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationVolume = 0
      useGameStore(pinia).setAudioPlayer({
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      })
      pushTurn(news())
      await vi.advanceTimersByTimeAsync(0)
      expect(card(w)).toContain('Hint of magic')
      await key(' ')
      expect(card(w)).toContain('Quest updated')
      await key('Enter')
      expect(card(w)).toBe('')
    })

    it('after Escape, shows the skipped lines first and holds the card; Space brings it up, a second Escape ends it', async () => {
      const w = await ready(true, true)
      useGameStore(pinia).setAudioPlayer({
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      })
      pushTurn({ ...news(), text: 'A green garden.', narrate: true })
      await vi.advanceTimersByTimeAsync(0)
      await key('Escape')
      await vi.advanceTimersByTimeAsync(0)
      // The skipped line is on the story, not pushed aside by the card.
      expect(card(w)).toBe('')
      expect(storyAside(w)).toBe(false)
      expect(w.get('.lq-story').text()).toContain('A green garden.')
      await key(' ')
      expect(card(w)).toContain('Hint of magic')

      pushTurn({ ...news(91), text: 'A green garden.', narrate: true })
      await vi.advanceTimersByTimeAsync(0)
      await key('Escape')
      await vi.advanceTimersByTimeAsync(0)
      expect(useArrivalStore(pinia).holding).toBe(true)
      await key('Escape')
      expect(useArrivalStore(pinia).holding).toBe(false)
      await vi.advanceTimersByTimeAsync(10000)
      expect(card(w)).toBe('')
    })

    it('ends all the news of the turn with Escape', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationVolume = 0
      useGameStore(pinia).setAudioPlayer({
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      })
      pushTurn(news())
      await vi.advanceTimersByTimeAsync(0)
      await key('Escape')
      expect(card(w)).toBe('')
      expect(w.findAll('[data-testid="news-line"]')).toHaveLength(0)
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

  it('keeps the paper away only while the arrival is told', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationVolume = 0
    await run('go north')
    expect(storyAside(w)).toBe(true)
    await key('Escape')
    await run('look')
    expect(slidAside(w)).toBe(false)
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

  it('goes on when the narration volume is turned to 0 while it is told', async () => {
    const w = await ready()
    await run('go north')
    expect(card(w)).not.toBe('')
    useSettingsStore(pinia).narrationVolume = 0
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).not.toBe('')
  })

  it('does not let a held key run through the parts', async () => {
    const w = await ready()
    useSettingsStore(pinia).narrationVolume = 0
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
    useSettingsStore(pinia).narrationVolume = 0
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
    useSettingsStore(pinia).narrationVolume = 0
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
            name: 'Hint of magic',
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
      useSettingsStore(pinia).narrationVolume = 0
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

    it('tells nothing in the middle and rings nothing for a turn a load brought back', async () => {
      const w = await ready(true, false)
      useSettingsStore(pinia).narrationVolume = 0
      const game = useGameStore(pinia)
      const audio = {
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      }
      game.setAudioPlayer(audio)
      pushSpellTurn()
      const restored = game.turns.at(-1)
      if (restored) restored.restored = true
      await vi.advanceTimersByTimeAsync(0)
      expect(card(w)).toBe('')
      expect(useArrivalStore(pinia).active).toBe(false)
      expect(audio.playNewSpell).not.toHaveBeenCalled()
      await run('look')
      expect(audio.playNewSpell).not.toHaveBeenCalled()
    })

    /** A narrated turn that taught a spell and finished a quest, with the audio it rings. */
    async function narratedSpellTurn(): Promise<{
      playNewQuest: ReturnType<typeof vi.fn>
      playQuestComplete: ReturnType<typeof vi.fn>
      playNewSpell: ReturnType<typeof vi.fn>
    }> {
      const audio = {
        playNewQuest: vi.fn(),
        playQuestComplete: vi.fn(),
        playNewSpell: vi.fn(),
      }
      useGameStore(pinia).setAudioPlayer(audio)
      pushSpellTurn()
      const turn = useGameStore(pinia).turns.at(-1)
      if (turn) {
        turn.text = `A green garden.\n${LEARNED}`
        turn.narrate = true
      }
      await vi.advanceTimersByTimeAsync(0)
      return audio
    }

    it('rings the spell sound once when the talk is skipped with Escape', async () => {
      await ready(true, true)
      const audio = await narratedSpellTurn()
      await key('Escape')
      await vi.advanceTimersByTimeAsync(20000)
      expect(audio.playNewSpell).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
    })

    it('rings the spell sound once when a second Escape ends the held news', async () => {
      await ready(true, true)
      const audio = await narratedSpellTurn()
      await key('Escape')
      await key('Escape')
      await vi.advanceTimersByTimeAsync(20000)
      expect(audio.playNewSpell).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
    })

    it('rings the spell sound once when the player moves on before the news comes up', async () => {
      await ready(true, true)
      const audio = await narratedSpellTurn()
      await run('look')
      await vi.advanceTimersByTimeAsync(20000)
      expect(audio.playNewSpell).toHaveBeenCalledOnce()
      expect(audio.playQuestComplete).toHaveBeenCalledOnce()
    })

    it('rings no spell sound when a new game starts while the news is pending', async () => {
      await ready(true, true)
      const audio = await narratedSpellTurn()
      useGameStore(pinia).restartGame()
      await vi.advanceTimersByTimeAsync(20000)
      expect(audio.playNewSpell).not.toHaveBeenCalled()
    })

    it('rings no spell sound when a save is loaded while the news is pending', async () => {
      const stored: Record<string, string> = {}
      vi.stubGlobal('localStorage', {
        getItem: (key: string): string | null => stored[key] ?? null,
        setItem: (key: string, value: string): void => {
          stored[key] = value
        },
        removeItem: (key: string): void => {
          delete stored[key]
        },
      })
      await ready(true, true)
      const game = useGameStore(pinia)
      expect(game.saveGame()).toBe(true)
      const audio = await narratedSpellTurn()
      game.loadGame()
      await vi.advanceTimersByTimeAsync(20000)
      expect(game.turns.every((turn) => turn.restored)).toBe(true)
      expect(audio.playNewSpell).not.toHaveBeenCalled()
      expect(audio.playQuestComplete).not.toHaveBeenCalled()
    })

    it('leaves the line on the card where nothing is told in the middle', async () => {
      const w = await ready('short', false)
      useSettingsStore(pinia).narrationVolume = 0
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
