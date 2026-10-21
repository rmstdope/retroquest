import { describe, it, expect } from 'vitest'
import { Game, type Room } from '@/engine'
import { Act3 } from '../Act3'
import { Mural } from './Mural'
import { SeaSealedLetter } from './SeaSealedLetter'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act III game in the Tidal Causeway with its mural. */
function setup(): { game: Game; room: Room; mural: Mural } {
  const game = new Game([new Act3()])
  const room = game.state.allRooms.TidalCauseway
  const mural = room.items.find((i) => i instanceof Mural) as Mural | undefined
  expect(mural).toBeDefined()
  game.state.currentRoom = room
  return { game, room, mural: mural as Mural }
}

describe('Mural', () => {
  it('returns descriptive text on examine', () => {
    const { game, mural } = setup()

    const out = mural.examine(game.state).toLowerCase()

    expect(out.includes('sea') || out.includes('reliquary')).toBe(true)
  })

  it('reveals the sea-sealed letter once on examine', () => {
    const { game, room, mural } = setup()

    const out = mural.examine(game.state)

    expect(
      out.includes('[item_name]Sea-Sealed Letter') ||
        out.toLowerCase().includes('sea-sealed letter'),
    ).toBe(true)
    expect(room.items.filter((i) => i instanceof SeaSealedLetter)).toHaveLength(
      1,
    )
    mural.examine(game.state)
    expect(room.items.filter((i) => i instanceof SeaSealedLetter)).toHaveLength(
      1,
    )
  })

  it('looks like two figures shielding a child from a storm of sigils', () => {
    const { mural } = setup()

    expect(mural.description).toContain(
      'two figures shielding a small child from a storm of sigils',
    )
    expect(mural.description).toContain('a third reaches toward them')
  })

  it('shows the after line once the letter is found', () => {
    const { game, mural } = setup()
    mural.examine(game.state)

    const out = mural.examine(game.state)

    expect(out).toContain('The two figures still shield the child')
    expect(out).toContain('empty stone now shows its place')
    expectMarkupWellFormed(out)
  })
})
