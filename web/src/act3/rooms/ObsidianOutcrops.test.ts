import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { ObsidianOutcrops } from './ObsidianOutcrops'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act III game for markup checks. */
function createMarkupGame(): Game {
  return new Game([new Act3()])
}

describe('Obsidian Outcrops', () => {
  it('reveals the mirror segment and resin once when searched', () => {
    const act3 = new Act3()
    const game = new Game([act3])

    const room = act3.rooms.ObsidianOutcrops
    const gs = game.state
    gs.currentRoom = room

    // First search reveals items
    const out1 = room.search(gs)
    expect(
      out1.toLowerCase().includes('brass') ||
        out1.toLowerCase().includes('resin'),
    ).toBe(true)
    const namesAfter = room.items.map((i) => i.name.toLowerCase())
    expect(namesAfter).toContain('brass mirror segment')
    expect(namesAfter).toContain('binding resin')

    // Second search should not add additional items
    const out2 = room.search(gs)
    expect(
      out2.toLowerCase().includes('nothing new') ||
        out2.toLowerCase().includes('same as before'),
    ).toBe(true)
    const namesAfter2 = room.items.map((i) => i.name.toLowerCase())
    // Count remains the same (still contains the two revealed items)
    expect(
      namesAfter2.filter((n) => n === 'brass mirror segment'),
    ).toHaveLength(1)
    expect(namesAfter2.filter((n) => n === 'binding resin')).toHaveLength(1)
  })

  it('uses known tags when searched a second time', () => {
    const game = createMarkupGame()
    const room = new ObsidianOutcrops()
    room.search(game.state)

    const answer = room.search(game.state)

    expect(answer).toContain('nothing new comes loose')
    expectMarkupWellFormed(answer)
  })
})
