import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_GUARDIANS_CHAIN_RAISED } from '../Act4StoryFlags'
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

    expect(elsewhere).toContain('The crystals stay quiet')
    expect(game.state.getStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED)).toBe(true)
    expect(again).toContain('The chain is already lit')
    for (const answer of [elsewhere, again]) {
      expectMarkupWellFormed(answer)
    }
  })

  it('has the crystals the hall and the captain see, also in an old save', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    const chain = new GuardiansChain()
    chain.description = 'A silver chain, each link inscribed with runes.'
    expect(chain.examine(game.state)).toBe(
      'A silver chain set with small crystals, each link inscribed with runes. It bound the guardians to the stones; now it binds nothing.',
    )
  })
})
