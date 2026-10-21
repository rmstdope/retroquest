import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { LoyaltyToken } from './LoyaltyToken'
import { FLAG_ACT4_TOWER_STAIR_OPEN } from '../Act4StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('LoyaltyToken', () => {
  /** A game with the token in the pack and Elior in the tower. */
  function inTower(): Game {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    game.state.currentRoom = game.state.allRooms.TowerOfShadows
    return game
  }

  it('is carried from the start of the act', () => {
    const game = new Game([new Act4()])
    expect(game.state.hasItem('Loyalty Token')).toBe(true)
  })

  it('gives the first hint in the tower and changes nothing', () => {
    const game = inTower()
    const before = { ...game.state.storyFlags }
    const hint = new LoyaltyToken().use(game.state)
    expect(hint).toContain('Say their names.')
    expect(hint).toContain('in Mira')
    expectMarkupWellFormed(hint)
    expect(game.state.storyFlags).toEqual(before)
    expect(game.state.currentRoom.getExits(game.state)).not.toHaveProperty('up')
  })

  it('is quiet once the stair is open, warm in the chamber, glad elsewhere', () => {
    const game = inTower()
    game.state.setStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN, true)
    const quiet = new LoyaltyToken().use(game.state)
    expect(quiet).toContain(
      'The token is quiet and warm. The whispers are gone.',
    )
    game.state.currentRoom = game.state.allRooms.ChamberOfWhispers
    const chamber = new LoyaltyToken().use(game.state)
    game.state.currentRoom = game.state.allRooms.FortressGates
    const elsewhere = new LoyaltyToken().use(game.state)
    expect(chamber).toContain('still warm against your heart')
    expect(elsewhere).toContain('Someone, somewhere, is glad you came')
    for (const answer of [quiet, chamber, elsewhere]) {
      expectMarkupWellFormed(answer)
    }
  })
})
