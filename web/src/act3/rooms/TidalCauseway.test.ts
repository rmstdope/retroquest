import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { TidalCauseway } from './TidalCauseway'
import { RustedLockerKey } from '../items/RustedLockerKey'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act III game positioned on the Tidal Causeway. */
function createGame(): Game {
  const game = new Game([new Act3()])
  // Jump directly to Tidal Causeway for focused unit tests
  game.state.currentRoom = game.state.allRooms.TidalCauseway
  return game
}

/** An Act III game for markup checks. */
function createMarkupGame(): Game {
  return new Game([new Act3()])
}

describe('Tidal Causeway', () => {
  it('reveals the rusted key and updates the room when light is cast', () => {
    const game = createGame()
    const room = game.state.currentRoom
    expect(room).toBeInstanceOf(TidalCauseway)
    if (!(room instanceof TidalCauseway)) return

    // Ensure no rusted key present initially
    expect(room.items.some((i) => i instanceof RustedLockerKey)).toBe(false)

    // Call the room-specific light hook
    const out = room.castLightHere(game.state).toLowerCase()
    expect(
      out.includes('shadow') || out.includes('hollow') || out.includes('key'),
    ).toBe(true)

    // Now a RustedLockerKey should be present in the room
    expect(room.items.some((i) => i instanceof RustedLockerKey)).toBe(true)
  })

  it('uses known tags when light is cast a second time', () => {
    const game = createMarkupGame()
    const room = new TidalCauseway()
    room.castLightHere(game.state)

    const answer = room.castLightHere(game.state)

    expect(answer).toContain('nothing new comes free')
    expectMarkupWellFormed(answer)
  })
})
