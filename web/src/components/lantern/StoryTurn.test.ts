// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { SCENE_PAUSE_MS } from '@/lantern/narrationUnits'
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
import { useArrivalStore } from '@/stores/useArrivalStore'
import type { ArrivalPart } from '@/lantern/stageArrival'
import type { QuestNews } from '@/lantern/questNews'
import type { CardPiece } from '@/lantern/columnPieces'

function turn(partial: Partial<Turn>): Turn {
  return {
    id: 1,
    command: null,
    text: '',
    room: 'Village Square',
    description: null,
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
      description: { moved: true, firstVisit: false },
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
      quests: [{ kind: 'new', name: 'Hint of magic', main: false, text: 'x' }],
    })

    expect(w.get('.lq-quest-card .lq-quest-title').text()).toBe('Hint of magic')
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

  /** The pause after a spoken part (the store's GAP_MS). */
  const GAP = 350
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

  it('marks and lights a clue failure, while a plain refusal stays unmarked', async () => {
    const clueText = 'Something shiny.'
    const w = narrated(
      {
        text:
          '[event]You peer in.[/event]\n' +
          `[failure][clue]${clueText}[/clue][/failure]\n` +
          '[failure]Nothing here.[/failure]',
      },
      recorded(clueText),
    )
    await vi.advanceTimersByTimeAsync(0)
    const failures = w.findAll('.lq-block-failure')
    expect(failures).toHaveLength(1)
    expect(failures[0].classes()).toContain('lq-speaking')
    audios[0].currentTime = 0.3
    await vi.advanceTimersByTimeAsync(60)
    expect(failures[0].findAll('.lq-w-now').map((x) => x.text())).toEqual([
      'Something',
    ])
    expect(w.find('.lq-block-event').classes()).not.toContain('lq-speaking')
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
      {
        ...recorded('You go north.'),
        ...recorded('Cellar'),
        ...recorded(description),
      },
    )
    expect(w.find('[data-testid="divider"]').exists()).toBe(false)
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    expect(w.find('[data-testid="divider"]').exists()).toBe(false)
    await vi.advanceTimersByTimeAsync(SCENE_PAUSE_MS)

    expect(w.get('.lq-arrival').classes()).toContain('lq-speaking')
    expect(w.get('.lq-arrival-text').text()).toContain('A low room')
    audios[1].currentTime = 0.5
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['Cellar'])
    audios[1].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    audios[2].currentTime = 1
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['low'])
  })

  it('reads a room description in the story on a laptop too', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    try {
      const description = 'A low room with one window.'
      const w = narrated(
        {
          text: 'You go north.',
          arrival: {
            room: 'Cellar',
            description,
            characters: ['mouse'],
            items: [],
            exits: { south: 'Hall' },
          },
        },
        {
          ...recorded('You go north.'),
          ...recorded('Cellar'),
          ...recorded(description),
        },
      )
      audios[0].onended?.()
      await vi.advanceTimersByTimeAsync(GAP + 10 + SCENE_PAUSE_MS)

      expect(w.get('.lq-arrival').classes()).toContain('lq-speaking')
      expect(w.get('.lq-arrival-text').text()).toContain('A low room')
      expect(w.find('[data-testid="here"]').exists()).toBe(false)
      audios[1].onended?.()
      await vi.advanceTimersByTimeAsync(GAP + 10)
      audios[2].currentTime = 1
      await vi.advanceTimersByTimeAsync(60)
      expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['low'])
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('reads a new quest card’s heading and name, then its text, lighting each', async () => {
    const w = narrated(
      {
        text: 'Done.',
        quests: [
          { kind: 'new', name: 'Key', main: false, text: 'Find the key.' },
        ],
      },
      {
        ...recorded('Done.'),
        ...recorded('New side quest'),
        ...recorded('Key'),
        ...recorded('Find the key.'),
      },
    )
    expect(w.find('.lq-quest-card').exists()).toBe(false)
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)

    expect(w.get('.lq-quest-card').classes()).toContain('lq-speaking')
    audios[1].currentTime = 2
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['quest'])
    audios[1].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    audios[2].currentTime = 0.5
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['Key'])
    audios[2].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    audios[3].currentTime = 1
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['the'])
  })

  it('opens an updated notice by itself when the narrator reaches it, lighting its words', async () => {
    const w = narrated(
      {
        text: 'Done.',
        quests: [
          { kind: 'updated', name: 'Key', main: false, text: 'Find the key.' },
        ],
      },
      {
        ...recorded('Done.'),
        ...recorded('Quest updated'),
        ...recorded('Key'),
        ...recorded('Find the key.'),
      },
    )
    expect(w.find('.lq-update').exists()).toBe(false)
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)

    expect(w.get('.lq-update').attributes('aria-expanded')).toBe('true')
    expect(w.get('.lq-update-toggle').text()).toBe('Hide ▴')
    audios[1].currentTime = 2
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['updated'])
    audios[1].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    audios[2].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    audios[3].currentTime = 1
    await vi.advanceTimersByTimeAsync(60)
    expect(w.get('.lq-update-body').text()).toBe('Find the key.')
    expect(w.findAll('.lq-w-now').map((e) => e.text())).toEqual(['the'])
    audios[3].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    expect(w.get('.lq-update').attributes('aria-expanded')).toBe('true')
  })

  it('lets Hide fold an updated notice while it is read, and the reading goes on', async () => {
    const w = narrated(
      {
        text: 'Done.',
        quests: [
          { kind: 'updated', name: 'Key', main: false, text: 'Find the key.' },
        ],
      },
      { ...recorded('Done.'), ...recorded('Quest updated') },
    )
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    await w.get('.lq-update').trigger('click')

    expect(w.get('.lq-update').attributes('aria-expanded')).toBe('false')
    audios[1].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    expect(w.get('.lq-update').attributes('aria-expanded')).toBe('false')
  })

  it('opens an updated notice that has no recording, at its place', async () => {
    const w = narrated(
      {
        text: 'Done.',
        quests: [
          { kind: 'updated', name: 'Key', main: false, text: 'Find the key.' },
        ],
      },
      recorded('Done.'),
    )
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)

    expect(w.get('.lq-update').attributes('aria-expanded')).toBe('true')
  })

  it('opens an updated notice the player skipped past, without a highlight', async () => {
    const w = narrated(
      {
        text: 'Done.',
        quests: [
          { kind: 'updated', name: 'Key', main: false, text: 'Find the key.' },
        ],
      },
      {
        ...recorded('Done.'),
        ...recorded('Quest updated'),
        ...recorded('Key'),
        ...recorded('Find the key.'),
      },
    )
    useNarrationStore().skipAll()
    await vi.advanceTimersByTimeAsync(GAP + 10)

    expect(w.get('.lq-update').attributes('aria-expanded')).toBe('true')
    expect(w.findAll('.lq-w-now')).toHaveLength(0)
  })

  it('opens several updated notices one after another, each when its turn comes', async () => {
    const note = (name: string, text: string) =>
      ({ kind: 'updated', name, main: false, text }) as const
    const w = narrated(
      {
        text: 'Done.',
        quests: [note('Key', 'Find it.'), note('Map', 'Draw it.')],
      },
      {
        ...recorded('Done.'),
        ...recorded('Quest updated'),
        ...recorded('Key'),
        ...recorded('Find it.'),
        ...recorded('Map'),
        ...recorded('Draw it.'),
      },
    )
    audios[0].onended?.()
    await vi.advanceTimersByTimeAsync(GAP + 10)
    expect(w.findAll('.lq-update')).toHaveLength(1)
    for (const index of [1, 2, 3]) {
      audios[index].onended?.()
      await vi.advanceTimersByTimeAsync(GAP + 10)
    }

    const banners = w.findAll('.lq-update')
    expect(banners).toHaveLength(2)
    expect(banners.map((b) => b.attributes('aria-expanded'))).toEqual([
      'true',
      'true',
    ])
    expect(w.findAll('.lq-update-body').map((b) => b.text())).toEqual([
      'Find it.',
      'Draw it.',
    ])
  })

  it('leaves an updated notice folded when the turn is not narrated', () => {
    setActivePinia(createPinia())
    const w = mountTurn({
      text: 'Done.',
      quests: [
        { kind: 'updated', name: 'Key', main: false, text: 'Find the key.' },
      ],
    })

    expect(w.get('.lq-update').attributes('aria-expanded')).toBe('false')
    expect(w.get('.lq-update-toggle').text()).toBe('Show ▾')
  })
})

describe('StoryTurn as a narration card', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const ROOM = {
    room: 'Square',
    description: 'A busy square.',
    characters: [],
    items: [],
    exits: {},
  }

  function mountCard(partial: Partial<Turn>) {
    return mount(StoryTurn, { props: { turn: turn(partial), card: true } })
  }

  const TALK =
    '[event]You speak with [character_name]grandmother[/character_name].[/event]\n' +
    "[dialogue]'Sit down.'[/dialogue]\n" +
    'She does not sit down herself.'

  it('leaves the quotes of a conversation to the speech and keeps the narrator', () => {
    const w = mountCard({
      command: 'talk to grandmother',
      addressed: 'grandmother',
      text: TALK,
    })

    expect(w.find('.lq-block-dialogue').exists()).toBe(false)
    expect(w.text()).toContain('She does not sit down herself.')
  })

  it("leaves a character's quote to the speech when the turn is not a conversation", () => {
    const w = mountCard({ command: 'cast heal on grandmother', text: TALK })

    expect(w.find('.lq-block-dialogue').exists()).toBe(false)
    expect(w.text()).toContain('She does not sit down herself.')
  })

  it('keeps a quote when the turn leaves the room without a conversation', () => {
    const w = mountCard({
      command: 'go north',
      text: TALK,
      description: { moved: true, firstVisit: false },
    })

    expect(w.find('.lq-block-dialogue').exists()).toBe(true)
  })

  it("leaves Elior's own quote to the speech when the turn is not a conversation", () => {
    const w = mountCard({
      command: 'use journal',
      text:
        'The ink is smudged.\n' +
        '[character_name]Elior[/character_name]\n[dialogue]The storm.[/dialogue]',
    })

    expect(w.find('.lq-block-dialogue').exists()).toBe(false)
    expect(w.text()).toContain('The ink is smudged.')
  })

  it('keeps a quote nobody speaks (writing) even in a conversation', () => {
    const w = mountCard({
      command: 'talk to grandmother',
      addressed: 'grandmother',
      text: '[dialogue]The ink is smudged.[/dialogue]',
    })

    expect(w.get('.lq-block-dialogue').text()).toContain('The ink is smudged.')
  })

  /** The texts of the card's bubbles, in order. */
  const bubbles = (w: ReturnType<typeof mountCard>): string[] =>
    w.findAll('.lq-bubble').map((bubble) => bubble.text().replace(/\s+/g, ' '))

  it('tells each paragraph of the narrator in a bubble of its own, with no command echo', () => {
    const w = mountCard({
      command: 'talk to voice',
      text: 'You answer it.\n\nThe whisper comes once more.',
    })

    expect(bubbles(w)).toEqual([
      'You answer it.',
      'The whisper comes once more.',
    ])
    expect(w.find('[data-testid="command"]').exists()).toBe(false)
  })

  it('gives an event and a failure a bubble each', () => {
    const w = mountCard({
      command: 'take lantern',
      text: 'You lift it.\n[event]The lantern is lit.[/event]\n[failure]It is hot.[/failure]',
    })

    expect(bubbles(w)).toEqual([
      'You lift it.',
      '◆The lantern is lit.',
      '⊝It is hot.',
    ])
    expect(w.get('.lq-block-failure').classes()).toContain('lq-bubble-failure')
  })

  it('leaves the closing arrival line of a talk that moved Elior to the record', () => {
    const moving = {
      command: 'talk to voice',
      addressed: 'voice',
      description: { moved: true, firstVisit: true },
      text: 'You wake.\n[event]You are in [room_name]Cottage[/room_name].[/event]',
    }
    expect(bubbles(mountCard(moving))).toEqual(['You wake.'])
    const record = mount(StoryTurn, {
      props: { turn: turn(moving), record: true },
    })
    expect(record.text()).toContain('You are in Cottage.')
  })

  it('shows nothing when nobody but a speaker talks', () => {
    const w = mountCard({
      command: 'talk to grandmother',
      addressed: 'grandmother',
      text: "[character_name]Grandmother[/character_name]\n[dialogue]'Sit down.'[/dialogue]",
    })

    expect(w.find('article').exists()).toBe(false)
  })

  it('has no command line when none was typed', () => {
    const w = mountCard({
      arrival: ROOM,
      description: { moved: true, firstVisit: false },
    })

    expect(w.find('[data-testid="command"]').exists()).toBe(false)
    expect(w.text()).toContain('A busy square.')
  })

  it('tells the room as a bare description in a bubble on a look or a revisit, with no divider', () => {
    const w = mountCard({
      command: 'look',
      arrival: ROOM,
      description: { moved: false, firstVisit: false },
    })

    expect(bubbles(w).join(' ')).toContain('A busy square.')
    expect(w.find('[data-testid="divider"]').exists()).toBe(false)
  })

  it('leaves the description of a first visit to the middle of the picture', () => {
    const w = mountCard({
      command: 'go north',
      narrate: true,
      arrival: ROOM,
      description: { moved: true, firstVisit: true },
    })

    expect(w.find('article').exists()).toBe(false)
  })

  it('marks silent information with ⊝ in a red-edged bubble', () => {
    const w = mountCard({
      command: 'talk to mira',
      text: "[failure]There is no character named 'mira' here to speak to.[/failure]",
    })

    expect(w.get('.lq-failure-mark').text()).toBe('⊝')
    expect(w.get('.lq-bubble').classes()).toContain('lq-bubble-failure')
  })

  it('leaves a gained thing off the card (it flies to its button instead), and keeps what was lost', () => {
    const w = mountCard({
      command: 'trade bread for coin',
      text: 'Done.',
      gained: [{ name: 'Coin', count: 1, kind: 'item' }],
      lost: [{ name: 'Bread', count: 1, kind: 'item' }],
    })

    expect(
      w
        .findAll('[data-testid="chip"]')
        .map((chip) => chip.text().replace(/\s+/g, ' ')),
    ).toEqual(['− Lost Bread'])
  })

  it('keeps the chips in the record and outside the stage', () => {
    const gained = {
      command: 'take bread',
      text: 'Taken.',
      gained: [{ name: 'Bread', count: 1, kind: 'item' as const }],
    }
    expect(mountTurn(gained).find('[data-testid="chip"]').exists()).toBe(true)
    const record = mount(StoryTurn, {
      props: { turn: turn(gained), record: true },
    })
    expect(record.find('[data-testid="chip"]').exists()).toBe(true)
  })

  it('does not have the card look in the story drawer', () => {
    const w = mountTurn({ command: 'look', text: 'It is quiet.' })

    expect(w.classes()).not.toContain('lq-card')
    expect(w.find('.lq-failure-mark').exists()).toBe(false)
  })
})

describe('StoryTurn quest news told in the middle', () => {
  const done: QuestNews = {
    kind: 'completed',
    name: 'Hint of magic',
    main: false,
    text: 'You did it.',
    progress: { completed: 1, total: 11 },
  }
  const fresh: QuestNews = {
    kind: 'new',
    name: 'Magic for real',
    main: false,
    text: 'Go on.',
  }
  const piece = (news: QuestNews, unit: number): ArrivalPart => ({
    kind: 'news',
    news,
    lines: [{ unit, markup: news.text }],
    voiced: false,
  })

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('keeps the cards in the story when the news was not told in the middle', () => {
    const w = mountTurn({ command: 'x', text: 'Done.', quests: [done] })
    expect(w.find('[data-testid="news-line"]').exists()).toBe(false)
    expect(w.text()).toContain('You did it.')
  })

  it('shows neither card nor line while the news is still to be told', () => {
    useArrivalStore().show(1, [piece(done, 1), piece(fresh, 2)], false)
    const w = mountTurn({
      command: 'x',
      text: 'Done.',
      quests: [done, fresh],
    })
    expect(w.find('[data-testid="news-line"]').exists()).toBe(false)
    expect(w.text()).not.toContain('You did it.')
  })

  it('ends with one slim line per piece, in order, once the news has cleared', () => {
    const arrival = useArrivalStore()
    arrival.show(1, [piece(done, 1), piece(fresh, 2)], false)
    arrival.clear()
    const w = mountTurn({
      command: 'x',
      text: 'Done.',
      quests: [done, fresh],
    })
    const lines = w.findAll('[data-testid="news-line"]')
    expect(lines.map((line) => line.text().replace(/\s+/g, ' '))).toEqual([
      '✓ Side quest complete · Hint of magic Open in journal',
      'New side quest · Magic for real Open in journal',
    ])
    expect(w.text()).not.toContain('You did it.')
  })

  it('has no line for a turn without news', () => {
    const w = mountTurn({ command: 'x', text: 'Done.' })
    expect(w.find('[data-testid="news-line"]').exists()).toBe(false)
  })

  it('keeps the full cards in the record (Story so far), told in the middle or not', () => {
    const arrival = useArrivalStore()
    arrival.show(1, [piece(done, 1)], false)
    const waiting = mount(StoryTurn, {
      props: {
        turn: turn({ command: 'x', text: 'Done.', quests: [done] }),
        record: true,
      },
    })
    expect(waiting.text()).toContain('You did it.')
    arrival.clear()
    const cleared = mount(StoryTurn, {
      props: {
        turn: turn({ command: 'x', text: 'Done.', quests: [done] }),
        record: true,
      },
    })
    expect(cleared.text()).toContain('You did it.')
    expect(cleared.find('[data-testid="news-line"]').exists()).toBe(false)
  })

  it('shows no quest news on a card, even news not told in the middle', () => {
    const w = mount(StoryTurn, {
      props: {
        card: true,
        turn: turn({ command: 'x', text: 'Done.', quests: [done] }),
      },
    })
    expect(w.text()).toContain('Done.')
    expect(w.find('.lq-quest-card').exists()).toBe(false)
    expect(w.text()).not.toContain('Hint of magic')
  })

  it('leaves no line on a card for news told in the middle', () => {
    const arrival = useArrivalStore()
    arrival.show(1, [piece(done, 1)], false)
    arrival.clear()
    const w = mount(StoryTurn, {
      props: {
        card: true,
        turn: turn({ command: 'x', text: 'Done.', quests: [done] }),
      },
    })
    expect(w.text()).toContain('Done.')
    expect(w.find('[data-testid="news-line"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Hint of magic')
  })

  describe('a turn whose learned spell is told in the middle', () => {
    const told = {
      text: 'She nods.',
      fullText: 'She nods.\nYou have learned [spell_name]revive[/spell_name].',
      spells: [{ name: 'Revive', text: 'Calls back.' }],
    }

    it('shows the card without the learned line', () => {
      const w = mount(StoryTurn, { props: { turn: turn(told), card: true } })
      expect(visibleText(w)).toContain('She nods.')
      expect(visibleText(w)).not.toContain('You have learned')
    })

    it('keeps the line in the record', () => {
      const w = mount(StoryTurn, { props: { turn: turn(told), record: true } })
      expect(visibleText(w)).toContain('You have learned revive.')
    })
  })

  describe('a piece of the turn in the single column', () => {
    const piece = (over: Partial<CardPiece> = {}): CardPiece => ({
      kind: 'card',
      blocks: [],
      command: false,
      arrival: false,
      chips: false,
      news: false,
      ...over,
    })
    const text = 'First.\nSecond.'

    it('tells only the blocks of its piece', () => {
      const w = mount(StoryTurn, {
        props: {
          turn: turn({ command: 'look', text }),
          card: true,
          piece: piece({ blocks: [1] }),
        },
      })
      expect(visibleText(w)).toBe('Second.')
    })

    it('never echoes the command, even on the piece that carries it', () => {
      const w = mount(StoryTurn, {
        props: {
          turn: turn({ command: 'look', text }),
          card: true,
          piece: piece({ blocks: [0], command: true }),
        },
      })
      expect(w.find('[data-testid="command"]').exists()).toBe(false)
      expect(visibleText(w)).toBe('First.')
    })

    it('renders nothing when the piece holds only the command', () => {
      const w = mount(StoryTurn, {
        props: {
          turn: turn({ command: 'talk to mira', text }),
          card: true,
          piece: piece({ command: true }),
        },
      })
      expect(w.find('article').exists()).toBe(false)
    })

    it('puts no gained chip on any piece (the gained thing flies to its button instead)', () => {
      const t = turn({
        text,
        gained: [{ kind: 'item', name: 'key', count: 1 }],
      })
      const withChips = mount(StoryTurn, {
        props: {
          turn: t,
          card: true,
          piece: piece({ blocks: [1], chips: true }),
        },
      })
      expect(withChips.findAll('[data-testid="chip"]')).toHaveLength(0)
    })

    it('renders nothing for a piece with nothing to show', () => {
      const w = mount(StoryTurn, {
        props: {
          turn: turn({ text }),
          card: true,
          piece: piece({ news: true }),
        },
      })
      expect(w.find('article').exists()).toBe(false)
    })
  })
})
