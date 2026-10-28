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
    expect(sentence).not.toMatch(/chair|sit|seated/i)
    expect(sentence).toMatch(/bread/i)
  })
})
