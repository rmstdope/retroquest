import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Mechanism } from './Mechanism'
import { Rope } from './Rope'

/** A game standing in the Old Mill with a rope in hand. */
function gameInTheMill(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.OldMill
  game.state.addItemToInventory(new Rope())
  return game
}

describe('Mechanism', () => {
  it('asks for something to use with it in well-formed markup', () => {
    const game = new Game([new Act1()])
    expect(findMarkupProblems(new Mechanism().use(game.state))).toEqual([])
  })

  it('reads as a foreign device drawing on something beneath the mill', () => {
    const game = gameInTheMill()

    const response = executeCommands(game, ['examine mechanism'])

    expect(response).toContain('black iron')
    expect(response).toContain('rune')
    expect(response).toContain('beneath')
    expectMarkupWellFormed(response)
  })

  it('is jammed by the rope, which stops its draining whir', () => {
    const game = gameInTheMill()

    const response = executeCommands(game, ['use rope with mechanism'])

    expect(response).toContain('jam')
    expect(response).toContain('millstone')
    expectMarkupWellFormed(response)
    const mechanism = game.state.currentRoom.getItemByName('mechanism')
    if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
    const listened = mechanism.listen(game.state)
    expect(listened).toContain('silent')
    expect(listened).not.toContain('whirring')
    const examined = executeCommands(game, ['examine mechanism'])
    expect(examined).toContain('jammed')
  })
})
