import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_PARENTS_LEGACY_COMPLETED } from '../Act4StoryFlags'

describe('ParentsVault', () => {
  it('lists west always and north only once the memories are seen', () => {
    const game = new Game([new Act4()])
    const room = game.state.allRooms.ParentsVault
    expect(room.name).toBe("Parents' Vault")
    expect(Object.keys(room.getExits(game.state))).toEqual(['west'])
    game.state.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED, true)
    expect(room.getExits(game.state)).toEqual({
      west: 'MemoryVault',
      north: 'ThroneChamber',
    })
  })
})

describe('ParentsVault: Aren and Lysa', () => {
  /** A game standing in the vault, the memories not yet seen. */
  function inTheVault(): Game {
    const game = new Game([new Act4()])
    game.state.currentRoom = game.state.allRooms.ParentsVault
    return game
  }

  const NAMES = ['aren', 'lysa', 'parents', 'father', 'mother']

  it.each(NAMES)('"%s" does not answer before the memories', (name) => {
    const game = inTheVault()
    expect(game.talk(name)).toBe(
      'They do not turn. A memory cannot hear you. It only waits to be ' +
        'looked at.',
    )
    expect(game.examine(name)).toBe(
      'Two small figures in every lantern, your father and your mother. ' +
        'They do not know you are here.',
    )
  })

  it.each(NAMES)('"%s" does not answer after the memories either', (name) => {
    const game = inTheVault()
    game.examine('memories')
    expect(game.talk(name)).toBe(
      'The lanterns stay dim. They said what they stayed to say.',
    )
    expect(game.examine(name)).toBe(
      'The lanterns are dim and the figures in them are gone. You can ' +
        'still see them: your father over a workbench, your mother making ' +
        'a friend laugh.',
    )
  })

  it('leaves the memories unseen when they are only addressed', () => {
    const game = inTheVault()
    game.talk('lysa')
    game.examine('aren')
    expect(game.state.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)).toBe(
      false,
    )
  })

  it('gives the echoes back to a save from before they could be addressed', () => {
    const game = inTheVault()
    const room = game.state.allRooms.ParentsVault
    room.characters = []
    room.refreshSavedText(game.state)
    room.refreshSavedText(game.state)
    expect(room.characters).toHaveLength(1)
    expect(game.talk('aren')).not.toContain('[failure]')
  })
})
