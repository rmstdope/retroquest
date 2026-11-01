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

function setup(turns: Turn[] = [turn(1)]) {
  const list = ref<Turn[]>(turns)
  const key = ref('a')
  const paper = useNarrationPaper(
    () => list.value,
    () => key.value,
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
