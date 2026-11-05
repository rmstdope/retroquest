import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'

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
    expect(answer).not.toContain("You don't see")
    expect(answer).toMatch(/hearth/i)
  })

  it('is scenery that stays put, and leaves the journal hidden', () => {
    const game = cottage()
    game.examine('hearth')
    expect(game.examine('journal')).toContain("You don't see a 'journal'")
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

describe("Elior's Cottage bread", () => {
  function cottage(): Game {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.EliorsCottage
    return game
  }

  it('lies on the table from the start, and the room card says so', () => {
    const game = cottage()
    expect(game.state.currentRoom.getItemByName('bread')).not.toBeNull()
    expect(new GameController(game).getRoomDescription()).toMatch(/loaf/i)
  })

  it('is no longer said to cool on the table once Elior has taken it', () => {
    const game = cottage()
    executeCommands(game, ['take bread'])
    const text = new GameController(game).getRoomDescription()
    expect(text).not.toMatch(/loaf/i)
    expect(text).toMatch(/sturdy wooden table sits in the center/i)
  })

  it('can be taken without lighting the lantern', () => {
    const game = cottage()
    executeCommands(game, ['take bread'])
    expect(game.state.inventory.some((i) => i.name === 'bread')).toBe(true)
  })

  it('is restored in a save made while the lantern was still unlit', () => {
    const game = cottage()
    const room = game.state.allRooms.EliorsCottage
    room.items = room.items.filter((item) => item.name !== 'bread')
    new Act1().afterLoad(game.state)
    expect(room.getItemByName('bread')).not.toBeNull()
  })

  it('is not brought back once the lantern is lit', () => {
    const game = cottage()
    executeCommands(game, [
      'use lantern',
      'take bread',
      'use bread with chicken',
    ])
    const room = game.state.allRooms.EliorsCottage
    room.items = room.items.filter((item) => item.name !== 'bread')
    new Act1().afterLoad(game.state)
    expect(room.getItemByName('bread')).toBeNull()
  })

  it('is not copied when Elior already carries it, through a real save', () => {
    const game = cottage()
    executeCommands(game, ['take bread'])
    const loaded = cottage()
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
    const loaves = [
      ...loaded.state.inventory,
      ...loaded.state.allRooms.EliorsCottage.items,
    ].filter((item) => item.name === 'bread')
    expect(loaves).toHaveLength(1)
  })
})
