// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import ColumnTurn from './ColumnTurn.vue'
import { FOLLOW_EVENT } from '@/composables/useStoryFollow'
import type { Turn } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'

let nextId = 1

function turn(text: string, over: Partial<Turn> = {}): Turn {
  return {
    id: nextId++,
    command: 'talk to mira',
    text,
    room: 'Cottage',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
    addressed: 'Mira',
    ...over,
  }
}

const say = (name: string, words: string): string =>
  `[character_name]${name}[/character_name]\n[dialogue]${words}[/dialogue]`

/** The pieces in the column as "card" or the line's words, in order. */
function order(w: { element: Element }): string[] {
  return Array.from(w.element.children as HTMLCollection).map((el) =>
    el.classList.contains('lq-cl')
      ? `line:${el.querySelector('.lq-line')?.textContent?.trim()}`
      : 'card',
  )
}

describe('ColumnTurn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  it('tells the narrator between the lines in the order it happened', async () => {
    const speech = useStageSpeechStore()
    const t = turn(
      `${say('Mira', 'Hello.')}\nShe smiles.\n${say('Mira', 'Again.')}`,
    )
    speech.observe(t)
    const w = mount(ColumnTurn, { props: { turn: t, age: 'new' } })
    // The second line waits for its reading pause; nothing after it is out.
    expect(order(w)).toEqual(['card', 'line:Hello.', 'card'])
    speech.revealAll()
    await w.vm.$nextTick()
    expect(order(w)).toEqual(['card', 'line:Hello.', 'card', 'line:Again.'])
  })

  it('holds back a card that follows a line which has not appeared yet', () => {
    const speech = useStageSpeechStore()
    const t = turn(
      `${say('Mira', 'Hello.')}\n${say('Mira', 'Again.')}\nShe smiles.`,
    )
    speech.observe(t)
    const w = mount(ColumnTurn, { props: { turn: t, age: 'new' } })
    expect(w.text()).not.toContain('She smiles.')
    expect(w.text()).not.toContain('Again.')
  })

  it('names the speaker and shows a portrait once per run, again after a narrator card', () => {
    const t = turn(
      `${say('Mira', 'One.')}\n${say('Mira', 'Two.')}\nA pause.\n${say('Mira', 'Three.')}`,
    )
    const speech = useStageSpeechStore()
    speech.observe(t)
    speech.revealAll()
    const w = mount(ColumnTurn, { props: { turn: t, age: 'new' } })
    expect(w.findAll('.lq-line-name').map((n) => n.text())).toEqual([
      'Mira',
      'Mira',
    ])
    expect(w.findAll('[data-testid="portrait"]')).toHaveLength(2)
  })

  it('puts Elior at the left and everyone else at the right', () => {
    const t = turn(say('Mira', 'Yes.'), { command: 'say hello to mira' })
    const speech = useStageSpeechStore()
    speech.observe(t)
    speech.revealAll()
    const w = mount(ColumnTurn, { props: { turn: t, age: 'new' } })
    const lines = w.findAll('[data-testid="speech-line"]')
    expect(lines.map((l) => l.classes('lq-cl-left'))).toEqual([true, false])
    expect(lines[0].text()).toContain('hello')
  })

  it('wears the dimming of its age', () => {
    const t = turn('Hm.', { addressed: undefined })
    for (const age of ['new', 'prev', 'old'] as const) {
      const w = mount(ColumnTurn, { props: { turn: t, age } })
      expect(w.classes()).toContain(`lq-age-${age}`)
    }
  })

  it('keeps the lines of an older turn once the conversation has let go of them', () => {
    const t = turn(say('Mira', 'Hello.'))
    const w = mount(ColumnTurn, { props: { turn: t, age: 'old' } })
    expect(w.text()).toContain('Hello.')
  })

  it('rings the line being read, and no line of an older turn', async () => {
    const speech = useStageSpeechStore()
    const t = turn(say('Mira', 'Hello.'))
    speech.observe(t)
    speech.revealAll()
    vi.spyOn(speech, 'lineSpeaking').mockReturnValue(true)
    const reading = mount(ColumnTurn, { props: { turn: t, age: 'new' } })
    expect(reading.find('.lq-line').classes()).toContain('lq-speaking')
    vi.mocked(speech.lineSpeaking).mockReturnValue(false)
    const older = mount(ColumnTurn, { props: { turn: t, age: 'old' } })
    expect(older.find('.lq-line').classes()).not.toContain('lq-speaking')
  })

  it('asks the story to follow each of Elior’s lines as it is read, outside a conversation too', async () => {
    const speech = useStageSpeechStore()
    const t = turn(
      `The ink is smudged.\n${say('Elior', 'First page.\nSecond page.')}`,
      { command: 'use journal', addressed: undefined },
    )
    speech.observe(t)
    speech.revealAll()
    // Which paragraph (by its first word) the narrator reads; none at first.
    const reading = ref(-1)
    vi.spyOn(speech, 'lineSpeaking').mockImplementation(
      (_turnId, _unit, firstWord) => firstWord === reading.value,
    )
    const w = mount(ColumnTurn, {
      props: { turn: t, age: 'new' },
      attachTo: document.body,
    })
    const followed: string[] = []
    w.element.addEventListener(FOLLOW_EVENT, (event: Event) => {
      // Announced whole, not by its first line as a unit.
      const unit = event instanceof CustomEvent && event.detail?.unit === true
      if (!unit && event.target instanceof Element)
        followed.push(
          event.target.querySelector('.lq-line')?.textContent?.trim() ?? '',
        )
    })
    reading.value = 0
    await flushPromises()
    reading.value = 2
    await flushPromises()
    expect(followed).toEqual(['First page.', 'Second page.'])
    w.unmount()
  })

  it('follows the first of the paragraphs ringed at once (a quote without word timings)', async () => {
    const speech = useStageSpeechStore()
    const t = turn(say('Elior', 'First page.\nSecond page.'), {
      command: 'use journal',
      addressed: undefined,
    })
    speech.observe(t)
    speech.revealAll()
    const reading = ref(false)
    vi.spyOn(speech, 'lineSpeaking').mockImplementation(() => reading.value)
    const w = mount(ColumnTurn, {
      props: { turn: t, age: 'new' },
      attachTo: document.body,
    })
    const followed: string[] = []
    w.element.addEventListener(FOLLOW_EVENT, (event: Event) => {
      if (event.target instanceof Element)
        followed.push(
          event.target.querySelector('.lq-line')?.textContent?.trim() ?? '',
        )
    })
    reading.value = true
    await flushPromises()
    expect(followed).toEqual(['First page.'])
    w.unmount()
  })

  it('tells the room after a load on one card with no command', () => {
    const t = turn('', {
      command: null,
      addressed: undefined,
      arrival: {
        room: 'Cottage',
        description: 'Cosy.',
        characters: [],
        items: [],
        exits: {},
      },
    })
    const w = mount(ColumnTurn, { props: { turn: t, age: 'new' } })
    expect(w.findAll('[data-testid="turn"]')).toHaveLength(1)
    expect(w.find('[data-testid="command"]').exists()).toBe(false)
    expect(w.text()).toContain('Cosy.')
  })

  it('lights the word being read in Elior’s journal line, counted across its paragraphs (rq-v66a)', async () => {
    const speech = useStageSpeechStore()
    const narration = useNarrationStore()
    const audio = {
      play: () => Promise.resolve(),
      pause: () => undefined,
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
    }
    narration.setAudioFactory(() => audio)
    const quote = 'The storm came.\nI dreamed of fire.'
    const words = quote.split(/\s+/)
    const t = turn(say('Elior', quote), {
      command: 'use journal',
      addressed: undefined,
    })
    narration.begin(
      t.id,
      [
        {
          kind: 'block',
          parts: [
            {
              markup: quote,
              clip: {
                file: 'x.mp3',
                speaker: 'elior',
                duration: 9,
                words: words.map((word, i) => ({ word, start: i, end: i + 1 })),
              },
            },
          ],
        },
      ],
      'act1',
    )
    speech.observe(t)
    const w = mount(ColumnTurn, { props: { turn: t, age: 'new' } })
    audio.currentTime = 1.5
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((el) => el.text())).toEqual(['storm'])
    // The fifth word of the quote is the second word of its second paragraph.
    audio.currentTime = 4.5
    await vi.advanceTimersByTimeAsync(60)
    const lines = w.findAll('[data-testid="speech-line"]')
    expect(lines[1].findAll('.lq-w-now').map((el) => el.text())).toEqual([
      'dreamed',
    ])
    expect(lines[0].findAll('.lq-w-now')).toHaveLength(0)
  })
})
