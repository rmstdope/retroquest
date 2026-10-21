import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import { SeaSealedLetter } from './SeaSealedLetter'
import { parseTurn } from '@/lantern/parseTurn'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'
import { AncientAmulet } from './AncientAmulet'

/** The game state, moved to a room where Mira does not stand. */
function inAMiraFreeRoom(game: Game): GameState {
  game.state.currentRoom = game.state.allRooms.SubmergedAntechamber
  return game.state
}

describe('SeaSealedLetter', () => {
  it('exposes an appropriate name', () => {
    new Game([new Act3()])

    const letter = new SeaSealedLetter()

    expect(letter.name.toLowerCase().startsWith('sea')).toBe(true)
  })

  it('examining yields balanced, non-nested markup', () => {
    const game = new Game([new Act3()])

    const answer = new SeaSealedLetter().examine(inAMiraFreeRoom(game))

    expect(answer).toContain('Malakar, our friend')
    expect(answer).not.toContain('Lyra')
    expect(answer).not.toContain('Theron')
    expectMarkupWellFormed(answer)
  })

  it("is a plea from Aren and Lysa with Malakar's reply, as unlabelled quotes", () => {
    const game = new Game([new Act3()])

    const blocks = parseTurn(
      new SeaSealedLetter().examine(inAMiraFreeRoom(game)),
    )

    const quotes = blocks.filter((b) => b.kind === 'dialogue')
    expect(quotes).toHaveLength(5)
    expect(
      quotes.every((b) => b.kind === 'dialogue' && b.speaker === null),
    ).toBe(true)
    const text = JSON.stringify(blocks)
    expect(text).toContain('Wardens of the Dawn')
    expect(text).toContain('Aren and Lysa')
    expect(text).toContain('You would have me wait while you die. — M.')
    expect(text).toContain('He read it, and answered.')
  })

  it('shows the same text when looked at as when examined', () => {
    const game = new Game([new Act3()])
    const letter = new SeaSealedLetter()

    expect(letter.examine(game.state)).toContain(letter.description)
    expect(letter.examine(game.state)).toBe(letter.examine(game.state))
  })

  it('picking up uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new SeaSealedLetter().pickedUp(game.state)

    expect(answer).toContain('a plea to a friend, kept by the sea')
    expectMarkupWellFormed(answer)
  })

  it('shows exactly the agreed lines, with no quote marks of its own', () => {
    const game = new Game([new Act3()])

    const blocks = parseTurn(
      new SeaSealedLetter().examine(inAMiraFreeRoom(game)),
    )

    const lines = blocks.flatMap((b) =>
      b.kind === 'dialogue' ? [b.markup] : [],
    )
    expect(lines[0]).toBe('Malakar, our friend —')
    expect(lines[3]).toBe('— Aren and Lysa')
    expect(lines[4]).toBe('You would have me wait while you die. — M.')
    expect(lines.every((l) => !l.startsWith("'") && !l.endsWith("'"))).toBe(
      true,
    )
  })

  it('glows the amulet after the last line the first time only', () => {
    const game = new Game([new Act3()])
    const letter = new SeaSealedLetter()

    const first = letter.examine(game.state)
    const again = letter.examine(game.state)

    expect(first).toContain('At your side, the [item_name]Ancient Amulet')
    expect(first.indexOf('and answered')).toBeLessThan(
      first.indexOf('grows warm'),
    )
    expect(first.indexOf('Then the light fades.')).toBeLessThan(
      first.indexOf('Whatever is draining the king'),
    )
    expect(again).not.toContain('grows warm')
    expectMarkupWellFormed(first)
    expect(
      game.state.inventory.find((i) => i instanceof AncientAmulet)?.description,
    ).toContain('two faces linger')
  })
})
