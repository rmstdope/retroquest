import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { OfferingAltar } from './OfferingAltar'
import { DruidicCharm } from './DruidicCharm'
import { EnchantedAcorn } from './EnchantedAcorn'
import { NaturesCharm } from './NaturesCharm'
import { ProtectiveCharm } from './ProtectiveCharm'
import { QualityRope } from './QualityRope'
import { TravelersJournal } from './TravelersJournal'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('OfferingAltar', () => {
  it('shows a sign beside each hollow, one for each charm', () => {
    expect(new OfferingAltar().description).toBe(
      'An altar cut from one block of starstone, pale and speckled. Three ' +
        'hollows are carved in its top, and beside each a sign is cut: an oak ' +
        'leaf, a braid of grass, and a sword laid across a branch.',
    )
  })

  it('says only that a wrong item fits no hollow', () => {
    const game = new Game([new Act2()])
    const acorn = new EnchantedAcorn()
    expect(new OfferingAltar().useWith(game.state, acorn)).toBe(
      `${acorn.nameInSentence({ atStart: true })} fits none of the hollows. ` +
        'The runes stay dark.',
    )
  })

  it('says a wrong item fits no hollow whichever way round it is used', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.HeartOfTheForest
    const journal = new TravelersJournal()
    game.state.inventory.push(journal)
    const answer =
      `${journal.nameInSentence({ atStart: true })} fits none of the ` +
      'hollows. The runes stay dark.'

    expect(
      executeCommands(game, ["use traveler's journal with offering altar"]),
    ).toBe(answer)
    expect(
      executeCommands(game, ["use offering altar with traveler's journal"]),
    ).toBe(answer)
  })

  it('tells the rope it fits no hollow, though the rope has uses of its own', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.HeartOfTheForest
    const rope = new QualityRope()
    game.state.inventory.push(rope)
    const answer =
      `${rope.nameInSentence({ atStart: true })} fits none of the ` +
      'hollows. The runes stay dark.'

    expect(
      executeCommands(game, ['use quality rope with offering altar']),
    ).toBe(answer)
    expect(
      executeCommands(game, ['use offering altar with quality rope']),
    ).toBe(answer)
  })

  it('wakes the runes beside the charm placed, without listing the rest', () => {
    const game = new Game([new Act2()])
    const charm = new DruidicCharm()
    game.state.inventory.push(charm)
    expect(new OfferingAltar().useWith(game.state, charm)).toBe(
      `You set ${charm.nameInSentence()} in its hollow, and the runes beside ` +
        'it wake. The others stay dark, and so do their hollows.',
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
