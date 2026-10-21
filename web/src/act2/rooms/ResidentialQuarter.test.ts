import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { ResidentialQuarter } from './ResidentialQuarter'

const HINT =
  'At the end of one lane an old cellar door has been bricked up, and a ' +
  'cold draught breathes through the gaps.'
const AFTER =
  'At the end of one lane, behind the old storage crates, the way down to ' +
  'the hidden library stands open.'

describe('ResidentialQuarter search hint', () => {
  it('hints at the draught until the passage is found, then says it stands open', () => {
    const game = new Game([new Act2()])
    const room = new ResidentialQuarter()

    expect(room.descriptionFor(game.state)).toBe(`${room.description} ${HINT}`)

    room.search(game.state)
    const after = room.descriptionFor(game.state)
    expect(after).toBe(`${room.description} ${AFTER}`)
    expect(after).not.toContain(HINT)
    expect(room.exits.secret_passage).toBe('HiddenLibrary')
  })

  it('shows the matching sentence after a save and load', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ResidentialQuarter
    game.state.currentRoom.search(game.state)

    const loaded = new Game([new Act2()])
    loaded.loadSaveData(game.toSaveData())

    expect(loaded.state.currentRoom.descriptionFor(loaded.state)).toContain(
      AFTER,
    )
  })
})
