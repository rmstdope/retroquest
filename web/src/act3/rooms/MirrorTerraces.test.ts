import { describe, it, expect } from 'vitest'
import { Game, type Room } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_MIRRORS_MENDED,
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
  it('describes only what is there: no Terrace Warden', () => {
    const game = new Game([new Act3()])
    const text = findMirrorTerracesRoom(game).descriptionFor(game.state)
    expect(text).not.toContain('Terrace Warden')
    expect(text).toContain(
      'Ash has settled on the worktables, ' +
        'over files and polish left where someone put them down.',
    )
  })

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

  describe('waiting for the sun', () => {
    const REST = 'You rest for a moment, gathering your strength.'
    const WAITING_LINE =
      'The mended mirrors stand ready, their bright faces still waiting on the sun.'

    it('rests ordinarily before the mend and leaves the sun alone', () => {
      const game = new Game([new Act3()])
      const room = findMirrorTerracesRoom(game)
      expect(room.rest(game.state)).toBe(REST)
      expect(
        game.state.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED),
      ).toBe(false)
    })

    it('fires the beam on the first rest after the mend', () => {
      const game = new Game([new Act3()])
      const room = findMirrorTerracesRoom(game)
      game.state.setStoryFlag(FLAG_ACT3_MIRRORS_MENDED, true)

      expect(room.rest(game.state)).toBe(
        '[success]You settle on the warm stone and let the hours pass. ' +
          'The sun climbs until it stands squarely over the terraces. ' +
          'The great mirror catches it and throws one beam into the mountainside. ' +
          'Something gives inside the rock, ' +
          'and a narrow passage grinds open to the east.[/success]',
      )
      expect(
        game.state.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED),
      ).toBe(true)
      expect(room.getExits(game.state).east).toBeDefined()
      expect(room.rest(game.state)).toBe(REST)
    })

    it('does not fire the beam when resting anywhere else', () => {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_MIRRORS_MENDED, true)
      expect(game.state.allRooms.EmberGallery.rest(game.state)).toBe(REST)
      expect(
        game.state.getStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED),
      ).toBe(false)
    })

    it('shows the waiting line before the curse line, only while waiting', () => {
      const game = new Game([new Act3()])
      const room = findMirrorTerracesRoom(game)
      expect(room.descriptionFor(game.state)).not.toContain(WAITING_LINE)

      game.state.setStoryFlag(FLAG_ACT3_MIRRORS_MENDED, true)
      expect(room.descriptionFor(game.state).endsWith(WAITING_LINE)).toBe(true)

      game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
      const withCurse = room.descriptionFor(game.state)
      expect(withCurse.indexOf(WAITING_LINE)).toBeGreaterThan(-1)
      expect(withCurse.indexOf(WAITING_LINE)).toBeLessThan(
        withCurse.indexOf('Ash falls'),
      )
      expect(withCurse.endsWith('embers.')).toBe(true)

      game.state.setStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, true)
      expect(room.descriptionFor(game.state)).not.toContain(WAITING_LINE)
    })
  })
})
