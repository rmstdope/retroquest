import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { OfferingAltar } from './OfferingAltar'
import { DruidicCharm } from './DruidicCharm'

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
