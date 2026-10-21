import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { InnRooms } from './InnRooms'

const HINT = 'One floorboard beside the bed sits a little proud of the rest.'
const AFTER =
  'The loose floorboard beside the bed sits back in its place, the hiding ' +
  'place beneath it empty.'

describe('InnRooms search hint', () => {
  it('hints at the floorboard until the journal is found', () => {
    const game = new Game([new Act2()])
    const room = new InnRooms()

    const before = room.descriptionFor(game.state)
    expect(before).toBe(`${room.description} ${HINT}`)

    room.search(game.state)
    const after = room.descriptionFor(game.state)
    expect(after).toBe(`${room.description} ${AFTER}`)
    expect(after).not.toContain(HINT)
  })

  it('shows the matching sentence after a save and load', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.InnRooms
    const room = game.state.allRooms.InnRooms as InnRooms
    room.search(game.state)

    const loaded = new Game([new Act2()])
    loaded.loadSaveData(game.toSaveData())

    expect(loaded.state.currentRoom.descriptionFor(loaded.state)).toContain(
      AFTER,
    )
  })
})
