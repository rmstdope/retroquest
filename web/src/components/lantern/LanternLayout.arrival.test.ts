// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
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
  const audios: NarrationAudio[] = []
  /** The "change" listeners of the wide-screen query, to turn the window. */
  let wideChanges: ((event: { matches: boolean }) => void)[] = []

  /** Mount the layout on a wide screen (or a phone); `recorded` gives the garden's lines a voice. */
  async function ready(wide = true, recorded = true): Promise<VueWrapper> {
    vi.useFakeTimers()
    wideChanges = []
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: wide && query.includes('min-width'),
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
    useNarrationStore().setAudioFactory((): NarrationAudio => {
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
    const game = await startedHoldStore()
    game.actLabel = 'Act I'
    game.dismissTitle()
    wrapper = mount(LanternLayout, { attachTo: document.body })
    await vi.advanceTimersByTimeAsync(0)
    return wrapper
  }

  /** Run a command and let the layout start the arrival. */
  async function run(command: string): Promise<void> {
    useGameStore().submitCommand(command)
    await vi.advanceTimersByTimeAsync(0)
  }

  const card = (w: VueWrapper): string =>
    w.find('.lq-arrival-card').exists() ? w.get('.lq-arrival-card').text() : ''
  const storyAside = (w: VueWrapper): boolean =>
    w.get('.lq-story-wrap').classes().includes('lq-aside')
  const key = async (name: string): Promise<void> => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, bubbles: true }),
    )
    await vi.advanceTimersByTimeAsync(0)
  }

  beforeEach(() => {
    audios.length = 0
    setActivePinia(createPinia())
    try {
      localStorage.clear()
    } catch {
      // No storage in this environment.
    }
    useSettingsStore().narrationOn = true
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('tells a first visit on the picture, with the story aside and a Narration tab', async () => {
    const w = await ready()
    await run('go north')
    expect(card(w)).toContain('A green garden.')
    expect(card(w)).toContain('Click or press Enter to continue')
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(false)
    expect(storyAside(w)).toBe(true)
    expect(w.get('.lq-narration-tab').text()).toBe('▴ Narration')
  })

  it('clears 1½ s after the narrator finishes, and the story comes back with the arrival in it', async () => {
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
    expect(w.find('.lq-narration-tab').exists()).toBe(false)
    expect(w.get('.lq-story').text()).toContain('A green garden.')
  })

  it('reads it for its reading time with a bar when narration is off', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
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
    expect(useNarrationStore().isNarrating).toBe(true)
    await key('Enter')
    expect(card(w)).toBe('')
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(storyAside(w)).toBe(false)
  })

  it('goes on with a click on the picture', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
    await run('go north')
    await w.get('[data-testid="arrival-on-picture"]').trigger('click')
    expect(card(w)).toBe('')
  })

  it('goes on with Enter or Space from a focused verb, without pressing it', async () => {
    const w = await ready()
    await run('go north')
    const turns = useGameStore().turns.length
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
    expect(useGameStore().turns).toHaveLength(turns)
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
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(storyAside(w)).toBe(false)
  })

  it('clears with the Narration tab', async () => {
    const w = await ready()
    await run('go north')
    await w.get('.lq-narration-tab').trigger('click')
    expect(card(w)).toBe('')
    expect(useNarrationStore().isNarrating).toBe(false)
    expect(storyAside(w)).toBe(false)
  })

  it('clears when an action is chosen', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
    await run('go north')
    await w.get('[data-verb="take"]').trigger('click')
    expect(card(w)).toBe('')
  })

  it('clears when the player types, and the command still goes through', async () => {
    useSettingsStore().startMode = 'type'
    const w = await ready()
    useSettingsStore().narrationOn = false
    await run('go north')
    expect(card(w)).not.toBe('')
    const input = w.get('.lq-type-input')
    await input.setValue('inventory')
    expect(card(w)).toBe('')
    await input.trigger('keydown', { key: 'Enter' })
    expect(useGameStore().turns.at(-1)?.command).toBe('inventory')
  })

  it('clears for the next command', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
    await run('go north')
    await run('inventory')
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
  })

  it('does not tell a room already visited, nor a look', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
    await run('look')
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
    await run('go north')
    await w.get('.lq-narration-tab').trigger('click')
    await run('go south')
    expect(card(w)).toBe('')
    expect(storyAside(w)).toBe(false)
  })

  it('leaves a phone as it was', async () => {
    const w = await ready(false)
    await run('go north')
    expect(card(w)).toBe('')
    expect(w.find('.lq-narration-tab').exists()).toBe(false)
    expect(w.find('[data-testid="arrival-on-picture"]').exists()).toBe(false)
  })

  it('clears when the window turns into a phone', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
    await run('go north')
    expect(card(w)).not.toBe('')
    wideChanges.forEach((change) => change({ matches: false }))
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
  })

  it('tells what happens on arrival first, in italics, then the description, and keeps quest news for the story', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
    useGameStore().turns.push({
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
    expect(card(w)).toBe('')
    expect(w.get('.lq-story').text()).toContain('Go.')
  })

  it('shows a turn that is not narrated and has no room as it is', async () => {
    const w = await ready()
    useGameStore().turns.push({
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

  it('clears for a new game and a new act', async () => {
    const w = await ready()
    useSettingsStore().narrationOn = false
    await run('go north')
    useGameStore().gameNumber++
    await vi.advanceTimersByTimeAsync(0)
    expect(card(w)).toBe('')
    await run('go south')
    await run('go north')
  })

  it('reads silent events for their reading time before the narrator tells the description', async () => {
    const w = await ready()
    useGameStore().turns.push({
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
    useSettingsStore().narrationOn = false
    await run('go north')
    useGameStore().loadNumber++
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await vi.waitFor(() => expect(card(w)).toBe(''))
    expect(useArrivalStore().active).toBe(false)
  })
})
