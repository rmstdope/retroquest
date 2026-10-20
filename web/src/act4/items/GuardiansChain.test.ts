import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { GuardiansChain } from './GuardiansChain'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('GuardiansChain', () => {
  it('uses known tags when used elsewhere and again in the hall', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    const item = new GuardiansChain()
    const elsewhere = item.use(game.state)
    game.state.currentRoom = game.state.allRooms.HallOfEchoes
    item.use(game.state)

    const again = item.use(game.state)

    expect(elsewhere).toContain('glows softly')
    expect(again).toContain('already providing its protection')
    for (const answer of [elsewhere, again]) {
      expectMarkupWellFormed(answer)
    }
  })
})
