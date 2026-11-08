import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_GUARDIANS_CHAIN_RAISED } from '../Act4StoryFlags'
import { GuardiansChain } from './GuardiansChain'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

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

  it('raised at the Knight of Despair by name, does what raising it in the hall does', () => {
    /** A game in the Hall of Echoes with the guardian's chain in the pack. */
    function inHall(): Game {
      const act = new Act4()
      act.musicFile = ''
      const game = new Game([act])
      game.state.currentRoom = game.state.allRooms.HallOfEchoes
      game.state.addItemToInventory(new GuardiansChain())
      return game
    }
    const plain = inHall()
    const targeted = inHall()
    const expected = executeCommands(plain, ["use guardian's chain"])
    const answer = executeCommands(targeted, [
      "use guardian's chain on knight of despair",
    ])
    expect(answer).toBe(expected)
    expect(targeted.state.storyFlags).toEqual(plain.state.storyFlags)
  })
})
