import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'
import { Lantern } from './Lantern'

describe('Lantern', () => {
  it('cannot be taken before it is lit', () => {
    const game = new Game([new Act1()])
    const answer = executeCommands(game, ['take lantern'])
    expect(answer).toContain('[failure]')
    expect(answer).toContain('light the')
    expect(game.state.inventory.some((i) => i instanceof Lantern)).toBe(false)
  })

  it('can be carried once lit', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ['use lantern', 'take lantern'])
    const lantern = game.state.inventory.find((i) => i instanceof Lantern)
    expect(lantern).toBeInstanceOf(Lantern)
    expect(lantern instanceof Lantern && lantern.isLit()).toBe(true)
  })

  it('can be carried in a save made when it stayed in the cottage', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ['use lantern'])
    const lantern = game.state.currentRoom.items.find(
      (i) => i instanceof Lantern,
    )
    if (!lantern) throw new Error('no lantern in the cottage')
    lantern.canBeCarried = false
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    executeCommands(loaded, ['take lantern'])

    expect(loaded.state.inventory.some((i) => i instanceof Lantern)).toBe(true)
  })
})
