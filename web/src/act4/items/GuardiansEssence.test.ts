import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TrappedServants } from '../characters/TrappedServants'
import { GuardiansEssence } from './GuardiansEssence'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('GuardiansEssence', () => {
  it('uses known tags when used in each room and again on the servants', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    const essence = new GuardiansEssence()
    const elsewhere = essence.use(game.state)
    game.state.currentRoom = game.state.allRooms.HallOfEchoes
    const hall = essence.use(game.state)
    game.state.currentRoom = game.state.allRooms.OuterCourtyard
    const courtyard = essence.use(game.state)
    essence.useOnCharacter(game.state, new TrappedServants())

    const again = essence.useOnCharacter(game.state, new TrappedServants())

    expect(elsewhere).toContain('waiting for someone to show it to')
    expect(hall).toContain('steadies in the old hall')
    expect(courtyard).toContain('turns towards it')
    expect(again).toContain('The servants already know you')
    for (const answer of [elsewhere, hall, courtyard, again]) {
      expectMarkupWellFormed(answer)
    }
  })
})
