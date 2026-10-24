import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { Locket } from '../items/Locket'

/** An Act I game standing in Mira's Hut. */
function gameInHut(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.MirasHut
  return game
}

describe("Mira's Hut room card", () => {
  it('shows the amulet on its stand without a glow and no empty stand at first', () => {
    const text = new GameController(gameInHut()).getRoomDescription()
    expect(text).not.toContain('glows brighter')
    expect(text).not.toContain('stands empty')
  })

  it('shows the amulet glowing while Elior carries the locket', () => {
    const game = gameInHut()
    game.state.inventory.push(new Locket())
    expect(new GameController(game).getRoomDescription()).toContain(
      'glows brighter as you step in',
    )
  })

  it('shows the empty stand once the amulet is gone', () => {
    const game = gameInHut()
    game.state.currentRoom.removeItem('Ancient Amulet')
    expect(new GameController(game).getRoomDescription()).toContain(
      'The stand where the amulet rested stands empty.',
    )
  })
})
