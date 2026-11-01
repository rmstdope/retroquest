import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import type { Turn } from '@/stores/useGameStore'
import { useNarrationPaper } from './useNarrationPaper'

/** A turn that tells something unless `text` is empty. */
function turn(id: number, text = 'Something happens.'): Turn {
  return {
    id,
    command: 'look',
    text,
    room: 'Square',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
  }
}

function setup(turns: Turn[] = [turn(1)], wide = false) {
  const list = ref<Turn[]>(turns)
  const key = ref('a')
  const paper = useNarrationPaper(
    () => list.value,
    () => key.value,
    () => wide,
  )
  return { list, key, paper }
}

describe('useNarrationPaper', () => {
  it('holds only the current turn, and is open when it tells something', () => {
    const { paper } = setup([turn(1), turn(2)])
    expect(paper.shownTurns.value.map((t) => t.id)).toEqual([2])
    expect(paper.visible.value).toBe(true)
    expect(paper.hidden.value).toBe(false)
  })

  it('is not visible for a turn with nothing to tell, hidden or not', async () => {
    const { list, paper } = setup()
    paper.hide()
    list.value = [...list.value, turn(2, '')]
    await nextTick()
    expect(paper.visible.value).toBe(false)
  })

  it('hides and shows, and toggles', () => {
    const { paper } = setup()
    paper.hide()
    expect(paper.hidden.value).toBe(true)
    paper.show()
    expect(paper.hidden.value).toBe(false)
    paper.toggle()
    expect(paper.hidden.value).toBe(true)
  })

  it('opens again on a new turn, even a hidden one', async () => {
    const { list, paper } = setup()
    paper.hide()
    list.value = [...list.value, turn(2)]
    await nextTick()
    expect(paper.hidden.value).toBe(false)
    expect(paper.visible.value).toBe(true)
  })

  it('forgets everything when the reset key changes', async () => {
    const { key, paper } = setup()
    paper.hide()
    key.value = 'b'
    await nextTick()
    expect(paper.hidden.value).toBe(false)
  })
})

describe('useNarrationPaper on the laptop (cards)', () => {
  const moved = { moved: true, firstVisit: false }

  it('keeps a card for every turn since the last room change, newest last', () => {
    const { paper } = setup(
      [
        turn(1),
        { ...turn(2), description: moved },
        turn(3),
        { ...turn(4), text: '' },
      ],
      true,
    )
    expect(paper.shownTurns.value.map((t) => t.id)).toEqual([2, 3, 4])
  })

  it('keeps no more than eight cards', () => {
    const turns = Array.from({ length: 12 }, (_, index) => turn(index + 1))
    const { paper } = setup(turns, true)
    expect(paper.shownTurns.value.map((t) => t.id)).toEqual([
      5, 6, 7, 8, 9, 10, 11, 12,
    ])
  })

  it('has no card for a turn with no command and nothing to tell', () => {
    const { paper } = setup([{ ...turn(1), command: null, text: '' }], true)
    expect(paper.shownTurns.value).toEqual([])
    expect(paper.visible.value).toBe(false)
  })

  it('is visible while a card exists, a slim one included', () => {
    const { paper } = setup([{ ...turn(1), text: '' }], true)
    expect(paper.visible.value).toBe(true)
  })

  it('starts over after a new game empties the turns', async () => {
    const { list, paper } = setup([turn(1), turn(2)], true)
    list.value = []
    await nextTick()
    expect(paper.shownTurns.value).toEqual([])
  })

  it('opens again on a turn with a card, even a slim one, and stays as it is for one without', async () => {
    const { list, paper } = setup([turn(1)], true)
    paper.hide()
    list.value = [...list.value, { ...turn(2), text: '' }]
    await nextTick()
    expect(paper.hidden.value).toBe(false)

    paper.hide()
    list.value = [...list.value, { ...turn(3), command: null, text: '' }]
    await nextTick()
    expect(paper.hidden.value).toBe(true)
  })
})
