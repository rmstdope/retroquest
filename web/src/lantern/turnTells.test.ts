import { describe, expect, it } from 'vitest'
import type { Turn } from '@/stores/useGameStore'
import { startsFresh, turnHasCard, turnTells } from './turnTells'

/** A turn with nothing in it; each test adds the one thing it checks. */
function turn(extra: Partial<Turn> = {}): Turn {
  return {
    id: 1,
    command: 'wait',
    text: '',
    room: 'Square',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
    ...extra,
  }
}

describe('turnTells', () => {
  it('is false for a turn with nothing to tell', () => {
    expect(turnTells(turn())).toBe(false)
    expect(turnTells(turn({ text: '  \n ' }))).toBe(false)
  })

  it('is true for text, including an error reply', () => {
    expect(turnTells(turn({ text: 'You take the bread.' }))).toBe(true)
    expect(turnTells(turn({ text: "I don't understand that." }))).toBe(true)
  })

  it('is true for chips, quest cards and an arrival', () => {
    const chip = { name: 'Bread', count: 1, kind: 'item' as const }
    expect(turnTells(turn({ gained: [chip] }))).toBe(true)
    expect(turnTells(turn({ lost: [chip] }))).toBe(true)
    expect(
      turnTells(
        turn({
          quests: [{ kind: 'new', name: 'Q', text: 't', main: false }],
        }),
      ),
    ).toBe(true)
    expect(
      turnTells(
        turn({
          arrival: {
            room: 'Square',
            description: 'd',
            characters: [],
            items: [],
            exits: {},
          },
        }),
      ),
    ).toBe(true)
  })
})

describe('turnHasCard', () => {
  it('is true for a typed command even when nothing is told (a slim card)', () => {
    expect(turnHasCard(turn({ command: 'talk to grandmother' }))).toBe(true)
  })

  it('is true for a turn with no command that tells something, false for an empty system turn', () => {
    expect(turnHasCard(turn({ command: null, text: 'Saved.' }))).toBe(true)
    expect(turnHasCard(turn({ command: null }))).toBe(false)
  })
})

describe('turnHasCard for a room told in the middle', () => {
  const arrival = {
    room: 'Square',
    description: 'A square.',
    characters: [],
    items: [],
    exits: {},
  }
  const opening = turn({
    command: null,
    narrate: true,
    arrival,
    description: { moved: true, firstVisit: true },
  })

  it('leaves no card for the arrival that opens an act', () => {
    expect(turnHasCard(opening)).toBe(false)
  })

  it('still leaves one when that turn also says something', () => {
    expect(turnHasCard({ ...opening, text: 'A bell tolls.' })).toBe(true)
  })
})

describe('startsFresh', () => {
  const arrival = {
    room: 'Square',
    description: 'A square.',
    characters: [],
    items: [],
    exits: {},
  }

  it('is true for a turn that moves to another room, a load among them', () => {
    expect(
      startsFresh(turn({ description: { moved: true, firstVisit: true } })),
    ).toBe(true)
    expect(
      startsFresh(turn({ description: { moved: true, firstVisit: false } })),
    ).toBe(true)
  })

  it('is true for a system arrival (an act opening)', () => {
    expect(startsFresh(turn({ command: null, arrival }))).toBe(true)
  })

  it('is false for a look and for an ordinary command', () => {
    expect(
      startsFresh(
        turn({
          command: 'look',
          arrival,
          description: { moved: false, firstVisit: false },
        }),
      ),
    ).toBe(false)
    expect(startsFresh(turn())).toBe(false)
  })
})
