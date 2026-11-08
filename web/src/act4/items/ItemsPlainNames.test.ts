import { describe, it, expect } from 'vitest'
import { Game, type Item } from '@/engine'
import { Act4 } from '../Act4'
import { executeCommands } from '@/testing/gameHelpers'
import { GuardiansChain } from './GuardiansChain'
import { GuardiansEssence } from './GuardiansEssence'
import { KnightsRedemption } from './KnightsRedemption'
import { LoyaltyToken } from './LoyaltyToken'
import { NyxToken } from './NyxToken'
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
    ["knight's badge", () => new KnightsRedemption()],
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
    expect(expected).not.toContain("You don't see")
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

describe('"pendant" while Nyx\'s Token is the crystalline pendant in the pack', () => {
  const tokenLook = new NyxToken().description
  const pendantLook = new ServantsPendant().description

  /** A game at the start of Act IV carrying `items`, in that order, and nothing else. */
  function gameHolding(...items: Item[]): Game {
    const game = gameCarrying(items[0])
    game.state.inventory.splice(0, game.state.inventory.length, ...items)
    return game
  }

  it("answers with the token when no Servant's Pendant is held", () => {
    const game = gameHolding(new NyxToken())
    expect(executeCommands(game, ['examine pendant'])).toContain(tokenLook)
  })

  it('answers to "crystalline pendant", the words its description opens with', () => {
    const game = gameHolding(new NyxToken())
    expect(executeCommands(game, ['examine crystalline pendant'])).toContain(
      tokenLook,
    )
  })

  it('keeps "crystalline pendant" for the token when the Servant\'s Pendant is held too', () => {
    const game = gameHolding(new ServantsPendant(), new NyxToken())
    expect(executeCommands(game, ['examine crystalline pendant'])).toContain(
      tokenLook,
    )
  })

  it("still answers with the Servant's Pendant once both are held", () => {
    const game = gameHolding(new NyxToken(), new ServantsPendant())
    expect(executeCommands(game, ['examine pendant'])).toContain(pendantLook)
  })

  it("answers with the Servant's Pendant whichever was picked up first", () => {
    const game = gameHolding(new ServantsPendant(), new NyxToken())
    expect(executeCommands(game, ['examine pendant'])).toContain(pendantLook)
  })

  it("answers with the Servant's Pendant lying in the room over the token held", () => {
    const game = gameHolding(new NyxToken())
    game.state.currentRoom.addItem(new ServantsPendant())
    expect(executeCommands(game, ['examine pendant'])).toContain(pendantLook)
  })
})
