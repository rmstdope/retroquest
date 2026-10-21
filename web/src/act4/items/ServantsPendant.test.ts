import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { ServantsPendant } from './ServantsPendant'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('ServantsPendant', () => {
  it('uses known tags when used elsewhere and again in the labyrinth', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    const item = new ServantsPendant()
    const elsewhere = item.use(game.state)
    game.state.currentRoom = game.state.allRooms.MirrorLabyrinth
    item.use(game.state)

    const again = item.use(game.state)

    expect(elsewhere).toContain('has nothing to say here')
    expect(again).toContain('have said what they know')
    for (const answer of [elsewhere, again]) {
      expectMarkupWellFormed(answer)
    }
  })
})
