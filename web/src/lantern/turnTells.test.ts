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
  it('is false for a command that leaves no bubble: nothing told, speech only, or news told in the middle', () => {
    expect(turnHasCard(turn({ command: 'wait' }))).toBe(false)
    expect(
      turnHasCard(
        turn({
          command: 'talk to grandmother',
          addressed: 'Grandmother',
          text: '[character_name]Grandmother[/character_name]\n[dialogue]Sit.[/dialogue]',
        }),
        true,
      ),
    ).toBe(false)
    expect(
      turnHasCard(
        turn({
          command: 'kneel',
          quests: [{ kind: 'new', name: 'Q', main: false, text: 'Go.' }],
        }),
      ),
    ).toBe(false)
  })

  it('keeps a speech-only talk where the speech is told in the same column', () => {
    const talk = turn({
      command: 'talk to grandmother',
      addressed: 'Grandmother',
      text: '[character_name]Grandmother[/character_name]\n[dialogue]Sit.[/dialogue]',
    })
    expect(turnHasCard(talk, false)).toBe(true)
    expect(turnHasCard(talk, true)).toBe(false)
  })

  it('leaves a quote-only reply to the speech when nobody is addressed, unless the turn leaves the room', () => {
    const text =
      '[character_name]Fisherman[/character_name]\n[dialogue]Not a twinge.[/dialogue]'
    const cast = turn({ command: 'cast heal on fisherman', text })
    expect(turnHasCard(cast, true)).toBe(false)
    const left = turn({
      command: 'go north',
      text,
      description: { moved: true, firstVisit: false },
    })
    expect(turnHasCard(left, true)).toBe(true)
  })

  it('is true for a command whose answer the narrator tells, and for a loss to the bag but not a gain alone', () => {
    expect(turnHasCard(turn({ command: 'look', text: 'It is quiet.' }))).toBe(
      true,
    )
    // The gained thing flies to its button; a lost one keeps its chip.
    expect(
      turnHasCard(
        turn({
          command: 'take bread',
          gained: [{ name: 'Bread', count: 1, kind: 'item' }],
        }),
      ),
    ).toBe(false)
    expect(
      turnHasCard(
        turn({
          command: 'give bread',
          lost: [{ name: 'Bread', count: 1, kind: 'item' }],
        }),
      ),
    ).toBe(true)
  })

  it('leaves no card for a moving talk whose only narrator line is its closing arrival line', () => {
    expect(
      turnHasCard(
        turn({
          command: 'talk to voice',
          addressed: 'voice',
          description: { moved: true, firstVisit: false },
          text: '[event]You are in [room_name]Cottage[/room_name].[/event]',
        }),
      ),
    ).toBe(false)
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
