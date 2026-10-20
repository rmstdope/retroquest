import { describe, it, expect } from 'vitest'
import { Game, type Room } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
} from '../Act3StoryFlags'

/** Accept either compact or spaced room keys depending on setup. */
function findMirrorTerracesRoom(game: Game): Room {
  if ('MirrorTerraces' in game.state.allRooms) {
    return game.state.allRooms.MirrorTerraces
  }
  return game.state.allRooms['Mirror Terraces']
}

describe('Mirror Terraces', () => {
  it('sets the mirrors-started flag on enter', () => {
    const game = new Game([new Act3()])
    const room = findMirrorTerracesRoom(game)

    // ensure flag not set initially
    expect(
      game.state.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED),
    ).toBe(false)

    // call the room hook and verify the flag is set
    room.onEnter(game.state)
    expect(
      game.state.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_STARTED),
    ).toBe(true)
  })

  it('hides the east exit until the mirrors quest is completed', () => {
    const game = new Game([new Act3()])
    const room = findMirrorTerracesRoom(game)

    // ensure completion flag is not set -> east exit should be hidden
    game.state.setStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, false)
    const exitsBefore = room.getExits(game.state)
    expect(exitsBefore).not.toHaveProperty('east')

    // set completion flag and verify east exit appears
    game.state.setStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, true)
    const exitsAfter = room.getExits(game.state)
    expect(exitsAfter).toHaveProperty('east')
    expect(exitsAfter.east).toBe('FumarolePassages')

    // static mapping should still contain the east key
    expect(room.exits).toHaveProperty('east')
  })
})
