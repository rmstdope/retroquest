import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Bread } from '../items/Bread'
import { Key } from '../items/Key'

/** The coop's sentence about the key still up on the rafter. */
const GLINT = 'High on a rafter, out of reach, something glints'

/** An Act I game standing in the Chicken Coop. */
function gameInCoop(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.ChickenCoop
  return game
}

describe('Chicken Coop', () => {
  it('shows something glinting on the rafter while the key is up there', () => {
    const game = gameInCoop()
    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(GLINT)
  })

  it('no longer mentions the glint once the key has been knocked down', () => {
    const game = gameInCoop()
    game.state.addItemToInventory(new Bread())
    executeCommands(game, ['use bread with chicken'])
    const text = game.state.currentRoom.descriptionFor(game.state)
    expect(text).not.toContain('glints')
    expect(text).not.toContain('rafter')
    expect(text).toContain('casting striped shadows on the dirt floor.')
  })

  it('no longer mentions the glint for a save from before the flag, with the key in the bag', () => {
    const game = gameInCoop()
    game.state.addItemToInventory(new Key())
    expect(game.state.currentRoom.descriptionFor(game.state)).not.toContain(
      'glints',
    )
  })
})
