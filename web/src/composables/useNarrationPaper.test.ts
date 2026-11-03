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

function setup(
  turns: Turn[] = [turn(1)],
  wide = false,
  speechBeside = false,
  movePending: (turn: Turn) => boolean = () => false,
) {
  const list = ref<Turn[]>(turns)
  const key = ref('a')
  const paper = useNarrationPaper(
    () => list.value,
    () => key.value,
    () => wide,
    () => speechBeside,
    movePending,
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

  it('keeps the cards before a talk that moves Elior until its room has changed', () => {
    const talk = { ...turn(3), description: moved, addressed: 'voice' }
    const turns = [turn(1), turn(2), talk]
    let pending = true
    const { paper } = setup(turns, true, false, (t) => pending && t.id === 3)
    expect(paper.shownTurns.value.map((t) => t.id)).toEqual([1, 2, 3])
    pending = false
    const after = setup(turns, true, false, () => pending)
    expect(after.paper.shownTurns.value.map((t) => t.id)).toEqual([3])
  })

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
    // A command that tells nothing leaves no card (it is not echoed).
    expect(paper.shownTurns.value.map((t) => t.id)).toEqual([2, 3])
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

  it('is visible while a card exists, and not for a command that tells nothing', () => {
    expect(setup([turn(1)], true).paper.visible.value).toBe(true)
    expect(setup([{ ...turn(1), text: '' }], true).paper.visible.value).toBe(
      false,
    )
  })

  it('starts over after a new game empties the turns', async () => {
    const { list, paper } = setup([turn(1), turn(2)], true)
    list.value = []
    await nextTick()
    expect(paper.shownTurns.value).toEqual([])
  })

  it('opens again on a turn with a card, and stays as it is for one without', async () => {
    const { list, paper } = setup([turn(1)], true)
    paper.hide()
    list.value = [...list.value, turn(2)]
    await nextTick()
    expect(paper.hidden.value).toBe(false)

    paper.hide()
    list.value = [...list.value, { ...turn(3), text: '' }]
    await nextTick()
    expect(paper.hidden.value).toBe(true)
  })
})

describe('useNarrationPaper beside the speech (the two-sided laptop)', () => {
  const talk = (id: number): Turn => ({
    ...turn(
      id,
      '[character_name]Mira[/character_name]\n[dialogue]Hello.[/dialogue]',
    ),
    command: 'talk to mira',
    addressed: 'Mira',
  })

  it('has no card, and is not visible, for a talk told only as speech', () => {
    const { paper } = setup([talk(1)], true, true)
    expect(paper.shownTurns.value).toEqual([])
    expect(paper.visible.value).toBe(false)
  })

  it('keeps the talk in the one column, where its lines are told', () => {
    const { paper } = setup([talk(1)], true, false)
    expect(paper.shownTurns.value.map((t) => t.id)).toEqual([1])
  })

  it('opens the words again for a talk told only as speech', async () => {
    const { list, paper } = setup([turn(1)], true, true)
    paper.hide()
    list.value = [...list.value, talk(2)]
    await nextTick()
    expect(paper.hidden.value).toBe(false)
  })
})
