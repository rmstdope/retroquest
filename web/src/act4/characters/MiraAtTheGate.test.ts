import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { SorceressTruth } from '../items/SorceressTruth'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectNoStockReply,
} from '@/testing/gameHelpers'

describe('Mira at the Fortress Gates', () => {
  it("will not hold the Sorceress's mask", () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    game.state.currentRoom = game.state.allRooms.FortressGates
    game.state.inventory.push(new SorceressTruth())
    const answer = executeCommands(game, ["give sorceress's truth to mira"])
    expect(answer).toContain('Not with these hands.')
    expectDialogueSpeaker(answer, 'Mira')
    expectNoStockReply(answer)
  })
})
