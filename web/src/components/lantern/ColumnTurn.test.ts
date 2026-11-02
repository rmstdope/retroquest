// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ColumnTurn from './ColumnTurn.vue'
import type { Turn } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'

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
})
