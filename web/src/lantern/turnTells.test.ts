import { describe, expect, it } from 'vitest'
import type { Turn } from '@/stores/useGameStore'
import { turnTells } from './turnTells'

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
