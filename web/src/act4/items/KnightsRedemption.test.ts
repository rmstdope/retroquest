import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { KnightsRedemption } from './KnightsRedemption'
import { executeCommands } from '@/testing/gameHelpers'

describe('KnightsRedemption', () => {
  it('can be carried and examined', () => {
    const game = new Game([new Act4()])
    const badge = new KnightsRedemption()
    expect(badge.canBeCarried).toBe(true)
    expect(badge.examine(game.state)).toContain(
      "proof that even one of Malakar's own can turn back.",
    )
  })

  it('shown to the Sorceress by name, does what showing it in the chamber does', () => {
    /** A game in the Chamber of Whispers with the badge in the pack. */
    function inChamber(): Game {
      const act = new Act4()
      act.musicFile = ''
      const game = new Game([act])
      game.state.currentRoom = game.state.allRooms.ChamberOfWhispers
      game.state.addItemToInventory(new KnightsRedemption())
      return game
    }
    const plain = inChamber()
    const targeted = inChamber()
    const expected = executeCommands(plain, ["use knight's redemption"])
    const answer = executeCommands(targeted, [
      "use knight's redemption on sorceress of lies",
    ])
    expect(answer).toBe(expected)
    expect(targeted.state.storyFlags).toEqual(plain.state.storyFlags)
    expect(targeted.state.knownSpells.map((s) => s.name)).toEqual(
      plain.state.knownSpells.map((s) => s.name),
    )
  })
})
