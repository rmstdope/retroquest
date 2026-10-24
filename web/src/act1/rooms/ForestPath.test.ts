import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { Snare } from '../items/Snare'

/** An Act I game on the Forest Path with the vines cut and the kit snared. */
function gameWithVinesCut(): Game {
  const game = new Game([new Act1()])
  const path = game.state.allRooms.ForestPath
  game.state.currentRoom = path
  path.removeItem('Vines')
  path.addItem(new Snare())
  return game
}

describe('Forest Path room card', () => {
  it('shows the opened alcove with the caught kit once the vines are gone', () => {
    const game = gameWithVinesCut()
    const text = new GameController(game).getRoomDescription()
    expect(text).toContain('they now lie cut')
    expect(text).toContain('a fox kit is caught')
  })

  it('shows the cut, empty snare once the kit is freed', () => {
    const game = gameWithVinesCut()
    const snare = game.state.currentRoom.items.find((i) => i instanceof Snare)
    if (!(snare instanceof Snare)) throw new Error('no snare')
    snare.freed = true
    expect(new GameController(game).getRoomDescription()).toContain(
      'cut and empty',
    )
  })
})
