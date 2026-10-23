// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StoryTurn from './StoryTurn.vue'
import type { Turn } from '@/stores/useGameStore'
import {
  useNarrationStore,
  type NarrationAudio,
} from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import {
  narrationWords,
  type NarrationManifest,
} from '@/lantern/narrationManifest'
import { turnUnits } from '@/lantern/narrationUnits'

function turn(partial: Partial<Turn>): Turn {
  return {
    id: 1,
    command: null,
    text: '',
    room: 'Village Square',
    roomChanged: false,
    gained: [],
    lost: [],
    arrival: null,
    ...partial,
  }
}

/** Text a sighted player sees (screen-reader-only text removed). */
function visibleText(w: { element: Element }): string {
  const copy = w.element.cloneNode(true) as Element
  copy.querySelectorAll('.lq-sr-only').forEach((el) => el.remove())
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Text a screen reader announces (aria-hidden parts removed). */
function spokenText(w: { element: Element }): string {
  const copy = w.element.cloneNode(true) as Element
  copy.querySelectorAll('[aria-hidden="true"]').forEach((el) => el.remove())
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function mountTurn(partial: Partial<Turn>) {
  return mount(StoryTurn, { props: { turn: turn(partial) } })
}

describe('StoryTurn', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('echoes the command the player gave', () => {
    const w = mountTurn({ command: 'take bucket', text: 'Taken.' })

    expect(w.get('[data-testid="command"]').text()).toBe('› take bucket')
  })

  it('shows no echo for system output', () => {
    const w = mountTurn({ text: 'You look around.' })

    expect(w.find('[data-testid="command"]').exists()).toBe(false)
  })

  it('renders narration with its inline tags', () => {
    const w = mountTurn({
      text: 'You find a [item_name]faded photograph[/item_name].',
    })

    const text = w.get('.lq-block-text')
    expect(text.text()).toBe('You find a faded photograph.')
    expect(text.find('.theme-item_name').text()).toBe('faded photograph')
  })

  it('renders events and failures as their own blocks', () => {
    const w = mountTurn({
      text: "[event]You take a look around.[/event]\n[failure]You can't go that way.[/failure]",
    })

    expect(w.get('.lq-block-event').text()).toContain('You take a look around.')
    expect(w.get('.lq-block-failure').text()).toContain(
      "You can't go that way.",
    )
  })

  it('shows dialogue with a capitalised speaker label', () => {
    const w = mountTurn({
      text:
        '[event]You speak with [character_name]innkeeper marcus[/character_name].[/event]\n' +
        "[dialogue]'Welcome, traveller.'[/dialogue]",
    })

    const speech = w.get('.lq-block-dialogue')
    expect(speech.get('.lq-speaker').text()).toBe('Innkeeper Marcus')
    expect(speech.get('.lq-quote').text()).toBe("'Welcome, traveller.'")
  })

  it('shows dialogue without a label when the speaker is unknown', () => {
    const w = mountTurn({ text: "[dialogue]'Who goes there?'[/dialogue]" })

    expect(w.get('.lq-block-dialogue').find('.lq-speaker').exists()).toBe(false)
  })

  it('renders a checklist with done and not-yet items', () => {
    const w = mountTurn({
      text: '[success] * Warm clothing[/success]\n[pending] * Sturdy footwear[/pending]',
    })

    const items = w.findAll('.lq-block-checklist li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Warm clothing')
    expect(items[0].text()).toContain('done')
    expect(items[1].text()).toContain('Sturdy footwear')
    expect(items[1].text()).toContain('not yet')
  })

  it('shows gained and lost chips with display names and counts', () => {
    const w = mountTurn({
      command: 'cast greater_heal',
      text: 'Done.',
      gained: [
        { kind: 'item', name: 'bucket', count: 1 },
        { kind: 'spell', name: 'greater_heal', count: 1 },
      ],
      lost: [{ kind: 'item', name: 'coin', count: 2 }],
    })

    const chips = w.findAll('[data-testid="chip"]').map(visibleText)
    expect(chips).toEqual(['+ Bucket', '+ Greater Heal', '− Coin ×2'])
    expect(visibleText(w.get('.lq-chip-spell'))).toBe('+ Greater Heal')
  })

  it('names the chips for screen readers as gained and lost', () => {
    const w = mountTurn({
      text: 'Done.',
      gained: [{ kind: 'item', name: 'bucket', count: 1 }],
      lost: [{ kind: 'item', name: 'coin', count: 2 }],
    })

    const row = w.get('.lq-chips')
    expect(row.attributes('role')).toBe('group')
    expect(row.attributes('aria-label')).toBe('Changes')
    const chips = w.findAll('[data-testid="chip"]').map(spokenText)
    expect(chips).toEqual(['Gained Bucket', 'Lost Coin ×2'])
  })

  it('shows no chip row when nothing changed', () => {
    expect(mountTurn({ text: 'Nothing.' }).find('.lq-chips').exists()).toBe(
      false,
    )
  })

  it('labels only the first of several quotes by the same speaker', () => {
    const w = mountTurn({
      text:
        "[character_name]Mira[/character_name] smiles. [dialogue]'Welcome.'[/dialogue] " +
        "She pauses. [dialogue]'Sit down.'[/dialogue]",
    })

    const quotes = w.findAll('.lq-block-dialogue')
    expect(quotes).toHaveLength(2)
    expect(quotes[0].find('.lq-speaker').text()).toBe('Mira')
    expect(quotes[1].find('.lq-speaker').exists()).toBe(false)
  })

  it('labels a quote again when the speaker changes', () => {
    const w = mountTurn({
      text:
        "[character_name]Mira[/character_name] says [dialogue]'Hello.'[/dialogue] " +
        "[character_name]Borin[/character_name] grunts. [dialogue]'Aye.'[/dialogue]",
    })

    const labels = w.findAll('.lq-speaker').map((l) => l.text())
    expect(labels).toEqual(['Mira', 'Borin'])
  })

  it('shows the arrival in a new room after the answer', () => {
    setActivePinia(createPinia())
    const w = mountTurn({
      command: 'go south',
      text: '[event]You move south to [room_name]Vegetable Field[/room_name].[/event]',
      roomChanged: true,
      arrival: {
        room: 'Vegetable Field',
        description: 'Rows of withered crops.',
        characters: [],
        items: ['rusty hoe'],
        exits: { north: "Elior's Cottage" },
      },
    })

    const arrival = w.get('[data-testid="divider"]')
    expect(arrival.text()).toContain('Vegetable Field')
    expect(w.text()).toContain('Rows of withered crops.')
    expect(w.html().indexOf('lq-block-event')).toBeLessThan(
      w.html().indexOf('data-testid="divider"'),
    )
  })

  it('shows no arrival when the room did not change', () => {
    expect(
      mountTurn({ text: 'Nothing.' }).find('[data-testid="divider"]').exists(),
    ).toBe(false)
  })

  it('shows the quest news of the turn after its text', () => {
    setActivePinia(createPinia())
    const w = mountTurn({
      text: 'You feel strange.',
      quests: [{ kind: 'new', name: 'Hint of Magic', main: false, text: 'x' }],
    })

    expect(w.get('.lq-quest-card .lq-quest-title').text()).toBe('Hint of Magic')
  })
})

/** A recording for `markup` as the narrator, one second a word. */
function recorded(markup: string, speaker = 'narrator'): NarrationManifest {
  return {
    [narrationKey(speaker, markup)]: {
      file: 'x.mp3',
      speaker,
      duration: 9,
      words: narrationWords(markup).map((word, i) => ({
        word,
        start: i,
        end: i + 1,
      })),
    },
  }
}

describe('StoryTurn while it is narrated', () => {
  const audios: { currentTime: number; onended: (() => void) | null }[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    audios.length = 0
    useNarrationStore().setAudioFactory(() => {
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
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const TEXT =
    'Rain falls on the roof.\n[event]A door creaks.[/event]\nAfter that, quiet.'
  const manifest = {
    ...recorded('Rain falls on the roof.'),
    ...recorded('After that, quiet.'),
  }

  function narrated(
    partial: Partial<Turn> = {},
    clips: NarrationManifest = manifest,
  ) {
    const t = turn({ id: 5, text: TEXT, ...partial })
    useNarrationStore().begin(5, turnUnits(t, true, clips), 'act1')
    return mount(StoryTurn, { props: { turn: t } })
  }

  it('shows only what has been spoken, marking the block being spoken', () => {
    const w = narrated()

    expect(w.findAll('.lq-block-text')).toHaveLength(1)
    expect(w.get('.lq-block-text').classes()).toContain('lq-speaking')
    expect(w.find('.lq-block-event').exists()).toBe(false)
  })

  it('lights the word being spoken', async () => {
    const w = narrated()
    audios[0].currentTime = 2.3
    await vi.advanceTimersByTimeAsync(60)

    const lit = w.findAll('.lq-w-now')
    expect(lit.map((word) => word.text())).toEqual(['on'])
  })

  it('shows the event at once when the block before it is done, and goes on', async () => {
    const w = narrated()
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(350)

    expect(w.get('.lq-block-event').text()).toContain('A door creaks.')
    expect(w.findAll('.lq-block-text')).toHaveLength(2)
    expect(w.findAll('.lq-speaking')).toHaveLength(1)
  })

  it('marks a speech block, not just narration', async () => {
    const w = narrated(
      {
        text:
          'You speak with [character_name]Mira[/character_name].\n' +
          "[dialogue]'Come in.'[/dialogue]",
      },
      {
        ...recorded('You speak with [character_name]Mira[/character_name].'),
        ...recorded("'Come in.'", 'mira'),
      },
    )
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(350)

    expect(w.get('.lq-block-dialogue').classes()).toContain('lq-speaking')
  })

  it('shows the whole turn without marks once it is skipped', async () => {
    const w = narrated()
    useNarrationStore().skipAll()
    await w.vm.$nextTick()

    expect(w.findAll('.lq-block-text')).toHaveLength(2)
    expect(w.find('.lq-speaking').exists()).toBe(false)
    expect(w.find('.lq-w').exists()).toBe(false)
  })

  it('holds the chips back until the turn is told', async () => {
    const w = narrated({ gained: [{ kind: 'item', name: 'Key', count: 1 }] })
    expect(w.get('.lq-chips').classes()).toContain('lq-pending')

    useNarrationStore().skipAll()
    await w.vm.$nextTick()
    expect(w.get('.lq-chips').classes()).not.toContain('lq-pending')
  })

  it('marks the block but lights no word when the words do not match the recording', () => {
    const w = narrated(
      { text: 'Rain falls on the roof.' },
      {
        [narrationKey('narrator', 'Rain falls on the roof.')]: {
          file: 'x.mp3',
          speaker: 'narrator',
          duration: 3,
          words: [{ word: 'Rain', start: 0, end: 1 }],
        },
      },
    )

    expect(w.get('.lq-block-text').classes()).toContain('lq-speaking')
    expect(w.findAll('.lq-w-now')).toHaveLength(0)
  })

  it('shows another turn whole', () => {
    narrated()
    const other = mount(StoryTurn, {
      props: { turn: turn({ id: 2, text: TEXT }) },
    })

    expect(other.findAll('.lq-block-text')).toHaveLength(2)
    expect(other.find('.lq-speaking').exists()).toBe(false)
  })

  it('reads a room description on a first visit and marks its arrival', async () => {
    const description = 'A low room with one window.'
    const w = narrated(
      {
        text: 'You go north.',
        arrival: {
          room: 'Cellar',
          description,
          characters: [],
          items: [],
          exits: {},
        },
      },
      { ...recorded('You go north.'), ...recorded(description) },
    )
    expect(w.find('[data-testid="divider"]').exists()).toBe(false)
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(350)

    expect(w.get('.lq-arrival').classes()).toContain('lq-speaking')
    expect(w.get('.lq-arrival-text').text()).toContain('A low room')
  })

  it('marks a new quest card while its text is spoken', async () => {
    const w = narrated(
      {
        text: 'Done.',
        quests: [
          { kind: 'new', name: 'Key', main: false, text: 'Find the key.' },
        ],
      },
      {
        ...recorded('Done.'),
        ...recorded('Find the key.'),
      },
    )
    expect(w.find('.lq-quest-card').exists()).toBe(false)
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(350)

    expect(w.get('.lq-quest-card').classes()).toContain('lq-speaking')
    audios[1].currentTime = 1
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['the'])
  })
})
