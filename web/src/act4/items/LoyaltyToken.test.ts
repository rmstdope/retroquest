import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { LoyaltyToken } from './LoyaltyToken'
import {
  FLAG_ACT4_CHAIN_GIVEN,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL,
  FLAG_ACT4_TOWER_STAIR_OPEN,
} from '../Act4StoryFlags'
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
    expect(hint).toContain(
      "in [character_name]Mira[/character_name]'s voice, and what she said at the gate: say our names.",
    )
    expect(hint).not.toContain('Say their names.')
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

  describe('in the Hall of Echoes', () => {
    function hallGame(): Game {
      const act = new Act4()
      act.musicFile = ''
      const game = new Game([act])
      game.state.currentRoom = game.state.allRooms.HallOfEchoes
      return game
    }

    it('raises once, then reminds, without touching the tower’s raise', () => {
      const game = hallGame()
      const item = new LoyaltyToken()
      const first = item.use(game.state)
      expect(first).toContain(
        'You hold the loyalty token close to your heart. For a moment you are not alone in the hall: Mira at the gate, the light on the gatepost, the servants you freed. The knight’s despair breaks around you and does not reach you.'.replace(
          '’',
          "'",
        ),
      )
      expect(
        game.state.getStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL),
      ).toBe(true)
      const again = item.use(game.state)
      expect(again).toBe(
        "[dim]The token is still warm against your heart. The knight's despair cannot reach you.[/dim]",
      )
      expectMarkupWellFormed(first)
    })

    it('remembers the captain walking home in the chain once it is given', () => {
      const game = hallGame()
      game.state.setStoryFlag(FLAG_ACT4_CHAIN_GIVEN, true)
      const first = new LoyaltyToken().use(game.state)
      expect(first).toContain(
        'For a moment you are not alone in the hall: Mira at the gate, the ' +
          'light on the gatepost, the captain walking home in your chain.',
      )
      expect(first).not.toContain('the friends who brought you')
    })

    it('falls back to the usual line after the knight is redeemed', () => {
      const game = hallGame()
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
      const answer = new LoyaltyToken().use(game.state)
      expect(answer).toContain('Someone, somewhere, is glad you came')
      expect(
        game.state.getStoryFlag(FLAG_ACT4_LOYALTY_TOKEN_RAISED_IN_HALL),
      ).toBe(false)
    })
  })
})
