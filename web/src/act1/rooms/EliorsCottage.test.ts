import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'

/** The sentence of the cottage's room card that names Grandmother. */
function grandmotherSentence(): string {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.EliorsCottage
  const text = new GameController(game).getRoomDescription()
  const sentence = text
    .split(/(?<=[.!?])\s+/)
    .find((s) => s.includes('Grandmother'))
  if (sentence === undefined) throw new Error('Grandmother is not described')
  return sentence
}

describe("Elior's Cottage room card", () => {
  it('shows Grandmother up and baking, as her own lines have her', () => {
    const sentence = grandmotherSentence()
    expect(sentence).not.toMatch(/\b(chair|sits?|sitting|seated)\b/i)
    expect(sentence).toMatch(/bread/i)
  })
})

describe("Elior's Cottage hearth", () => {
  function cottage(): Game {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.EliorsCottage
    return game
  }

  it('can be examined, and answers about the hearth', () => {
    const answer = cottage().examine('hearth')
    expect(answer).not.toContain("You don't see that here")
    expect(answer).toMatch(/hearth/i)
  })

  it('is scenery that stays put, and leaves the bread hidden', () => {
    const game = cottage()
    game.examine('hearth')
    expect(game.examine('bread')).toContain("You don't see that here")
    expect(game.state.currentRoom.getItemByName('hearth')).not.toBeNull()
  })

  it('is restored in a save made before it existed', () => {
    const game = cottage()
    const room = game.state.allRooms.EliorsCottage
    room.items = room.items.filter((item) => item.name !== 'hearth')
    new Act1().afterLoad(game.state)
    expect(game.examine('hearth')).toMatch(/hearth/i)
  })
})
