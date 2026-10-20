import { describe, it, expect } from 'vitest'
import { nextTick, ref } from 'vue'
import { useCommandCompletion } from './useCommandCompletion'
import type { CompletionState } from '@/stores/useGameStore'

const TREE: Record<string, CompletionState> = {
  t: matches(['take', 'talk'], false, 't'),
  ta: matches(['take', 'talk'], false, 'ta'),
  'take ': matches(['apple', 'bread', 'candle'], false, ''),
  'take b': matches(['bread'], false, 'b'),
  'look ': matches(['at', 'well'], true, ''),
  look: matches(['look'], true, 'look'),
  'talk to mira': {
    kind: 'complete',
    candidates: [],
    sendable: true,
    word: 'mira',
  },
  xyz: { kind: 'none', candidates: [], sendable: false, word: 'xyz' },
}

function matches(
  candidates: string[],
  sendable: boolean,
  word: string,
): CompletionState {
  return { kind: 'matches', candidates, sendable, word }
}

const EXPANDED: Record<string, string> = {
  'take bread': 'take bread ',
  'take apple': 'take apple ',
  'take bread ': 'take bread ',
}

function setup(enabled = true) {
  const text = ref('')
  const accepting = ref(enabled)
  const completion = useCommandCompletion(
    text,
    (input) =>
      TREE[input] ?? {
        kind: 'none',
        candidates: [],
        sendable: false,
        word: input,
      },
    (input) => EXPANDED[input] ?? input,
    () => accepting.value,
  )
  return { text, accepting, ...completion }
}

async function type(c: ReturnType<typeof setup>, value: string) {
  c.text.value = value
  await nextTick()
}

/** A Tab key event that records whether the browser default was prevented. */
function tabKey(): { event: KeyboardEvent; prevented: () => boolean } {
  let prevented = false
  const event = {
    preventDefault: () => (prevented = true),
  } as unknown as KeyboardEvent
  return { event, prevented: () => prevented }
}

const key = (): KeyboardEvent => tabKey().event

describe('useCommandCompletion', () => {
  it('has no list for an empty box', () => {
    const c = setup()
    expect(c.open.value).toBe(false)
  })

  it('opens as soon as something is typed and pre-picks the first match', async () => {
    const c = setup()
    await type(c, 'ta')
    expect(c.open.value).toBe(true)
    expect(c.suggestions.value).toEqual(['take', 'talk'])
    expect(c.activeIndex.value).toBe(0)
    expect(c.word.value).toBe('ta')
  })

  it('pre-picks nothing when the text can already be sent', async () => {
    const c = setup()
    await type(c, 'look ')
    expect(c.suggestions.value).toEqual(['at', 'well'])
    expect(c.activeIndex.value).toBe(-1)
    expect(c.applyActive()).toBe(false)
  })

  it('shows a no-match state that cannot be picked', async () => {
    const c = setup()
    await type(c, 'xyz')
    expect(c.open.value).toBe(true)
    expect(c.noMatch.value).toBe(true)
    expect(c.word.value).toBe('xyz')
    expect(c.suggestions.value).toEqual([])
    expect(c.activeIndex.value).toBe(-1)
    expect(c.applyActive()).toBe(false)
  })

  it('closes on a complete command', async () => {
    const c = setup()
    await type(c, 'talk to mira')
    expect(c.open.value).toBe(false)
  })

  it('closes when the box is emptied and while input is not accepted', async () => {
    const c = setup()
    await type(c, 'ta')
    c.accepting.value = false
    expect(c.open.value).toBe(false)
    c.accepting.value = true
    await type(c, '')
    expect(c.open.value).toBe(false)
  })

  it('inserts the highlighted word on Enter and moves on', async () => {
    const c = setup()
    await type(c, 'take b')
    expect(c.applyActive()).toBe(true)
    expect(c.text.value).toBe('take bread ')
  })

  it('inserts the first match on Tab, or the highlighted one', async () => {
    const c = setup()
    await type(c, 'take b')
    c.onTab(key())
    expect(c.text.value).toBe('take bread ')

    await type(c, 'take ')
    c.onArrowDown()
    expect(c.activeIndex.value).toBe(1)
    c.onTab(key())
    expect(c.text.value).toBe('take bread ')
  })

  it('does nothing on Tab with no match but still keeps the focus', async () => {
    const c = setup()
    await type(c, 'xyz')
    const tab = tabKey()
    c.onTab(tab.event)
    expect(tab.prevented()).toBe(true)
    expect(c.text.value).toBe('xyz')
  })

  it('does not insert anything on Tab in an empty box', () => {
    const c = setup()
    c.text.value = ''
    c.onTab(key())
    expect(c.text.value).toBe('')
  })

  it('leaves Tab alone while input is not accepted', () => {
    const c = setup(false)
    const tab = tabKey()
    c.onTab(tab.event)
    expect(tab.prevented()).toBe(false)
  })

  it('wraps the highlight with the arrow keys', async () => {
    const c = setup()
    await type(c, 'take ')
    expect(c.activeIndex.value).toBe(0)
    c.onArrowUp()
    expect(c.activeIndex.value).toBe(2)
    c.onArrowDown()
    expect(c.activeIndex.value).toBe(0)

    await type(c, 'look ')
    c.onArrowUp()
    expect(c.activeIndex.value).toBe(1)
  })

  it('picks the first with the down arrow when nothing is highlighted', async () => {
    const c = setup()
    await type(c, 'look ')
    c.onArrowDown()
    expect(c.activeIndex.value).toBe(0)
  })

  it('hides on Escape until the text changes again', async () => {
    const c = setup()
    await type(c, 'ta')
    c.close()
    expect(c.open.value).toBe(false)
    expect(c.text.value).toBe('ta')
    await type(c, 't')
    expect(c.open.value).toBe(true)
  })

  it('forgets an arrow pick when the text changes', async () => {
    const c = setup()
    await type(c, 'take ')
    c.onArrowDown()
    expect(c.activeIndex.value).toBe(1)
    await type(c, 'take b')
    expect(c.activeIndex.value).toBe(0)
  })

  it('applies a clicked word like Enter on a highlighted one', async () => {
    const c = setup()
    await type(c, 'take ')
    c.apply('apple')
    expect(c.text.value).toBe('take apple ')
  })
})
