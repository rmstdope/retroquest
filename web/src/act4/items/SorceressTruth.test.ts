import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { EchoStone } from './EchoStone'
import { SorceressTruth } from './SorceressTruth'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('SorceressTruth', () => {
  it('can be carried, examined and used anywhere', () => {
    const game = new Game([new Act4()])
    const item = new SorceressTruth()
    expect(item.name).toBe("Sorceress's Truth")
    expect(item.canBeCarried).toBe(true)
    for (const text of [item.examine(game.state), item.use(game.state)]) {
      expectMarkupWellFormed(text)
    }
    expect(item.examine(game.state)).toContain('a lie she no longer needs')
    expect(item.use(game.state)).toContain('a liar can choose the truth')
  })

  it('no longer looks for someone to show it to once the Shadow has seen it', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    const stone = new EchoStone()
    stone.enhance()
    game.state.inventory.push(stone, new SorceressTruth())
    game.state.currentRoom = game.state.allRooms.MemoryVault
    executeCommands(game, ['use enhanced echo stone', "use sorceress's truth"])
    game.state.currentRoom = game.state.allRooms.ThroneChamber

    const after = executeCommands(game, ["use sorceress's truth"])

    expect(after).toContain('The Shadow has seen it and given it back.')
    expect(after).not.toContain('Somewhere ahead')
  })
})
