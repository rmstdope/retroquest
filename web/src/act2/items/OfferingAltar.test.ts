import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { OfferingAltar } from './OfferingAltar'
import { DruidicCharm } from './DruidicCharm'
import { NaturesCharm } from './NaturesCharm'
import { ProtectiveCharm } from './ProtectiveCharm'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('OfferingAltar', () => {
  it('lists the missing charms in lower case', () => {
    const game = new Game([new Act2()])
    const charm = new DruidicCharm()
    game.state.inventory.push(charm)
    expect(new OfferingAltar().useWith(game.state, charm)).toContain(
      "to activate the full ritual: protective charm, nature's charm.",
    )
  })
})

describe('OfferingAltar summoning', () => {
  it('gathers the light and names Nyx once, leaving her arrival to her talk', () => {
    const game = new Game([new Act2()])
    const charms = [
      new DruidicCharm(),
      new ProtectiveCharm(),
      new NaturesCharm(),
    ]
    game.state.inventory.push(...charms)

    const answer = new OfferingAltar().useWith(game.state, charms[0])

    expect(answer).toBe(
      '[success]The three charms sink into the starstone, and the runes ' +
        'light one after another. Above the altar the light gathers and ' +
        'stays, the height of a woman. [character_name]Nyx[/character_name] ' +
        'has come.[/success]',
    )
    expect(answer).not.toMatch(/ethereal|ancient|energies|!/)
    expectMarkupWellFormed(answer)
  })
})
