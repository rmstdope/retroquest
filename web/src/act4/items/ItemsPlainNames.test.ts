import { describe, it, expect } from 'vitest'
import { Game, type Item } from '@/engine'
import { Act4 } from '../Act4'
import { executeCommands } from '@/testing/gameHelpers'
import { GuardiansChain } from './GuardiansChain'
import { GuardiansEssence } from './GuardiansEssence'
import { KnightsRedemption } from './KnightsRedemption'
import { LoyaltyToken } from './LoyaltyToken'
import { ServantsPendant } from './ServantsPendant'
import { SorceressTruth } from './SorceressTruth'

/** A game at the start of Act IV with `item` in the pack. */
function gameCarrying(item: Item): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.addItemToInventory(item)
  return game
}

describe('Act IV key items answer to the nouns the story calls them by', () => {
  const cases: [string, () => Item][] = [
    ['badge', () => new KnightsRedemption()],
    ['mask', () => new SorceressTruth()],
    ['silver mask', () => new SorceressTruth()],
    ['medallion', () => new LoyaltyToken()],
    ['chain', () => new GuardiansChain()],
    ['pendant', () => new ServantsPendant()],
    ['essence', () => new GuardiansEssence()],
  ]

  it.each(cases)('examine %s reads as the full name does', (noun, make) => {
    const full = make().name
    const expected = executeCommands(gameCarrying(make()), [`examine ${full}`])
    expect(expected).not.toContain("You don't have")
    expect(executeCommands(gameCarrying(make()), [`examine ${noun}`])).toBe(
      expected,
    )
  })

  it.each(cases)('use %s does what the full name does', (noun, make) => {
    const full = make().name
    const expected = executeCommands(gameCarrying(make()), [`use ${full}`])
    expect(expected).not.toContain("You don't have")
    expect(executeCommands(gameCarrying(make()), [`use ${noun}`])).toBe(
      expected,
    )
  })
})
