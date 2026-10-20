import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { LoyaltyToken } from './LoyaltyToken'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('LoyaltyToken', () => {
  it('uses known tags when used elsewhere and again in the tower', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    const item = new LoyaltyToken()
    const elsewhere = item.use(game.state)
    game.state.currentRoom = game.state.allRooms.TowerOfShadows
    item.use(game.state)

    const again = item.use(game.state)

    expect(elsewhere).toContain('glows softly')
    expect(again).toContain('already protecting you')
    for (const answer of [elsewhere, again]) {
      expectMarkupWellFormed(answer)
    }
  })
})
