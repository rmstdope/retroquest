import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
} from '../Act4StoryFlags'
import { KingAlden } from './KingAlden'
import { AncientAmulet } from '../items/AncientAmulet'
import { LifelightElixir } from '../items/LifelightElixir'
import { executeCommands, expectNoStockReply } from '@/testing/gameHelpers'

/** How he looks in the crystal: weeks there, not years (the Settled Timeline). */
const IN_THE_CRYSTAL =
  'The king of Eldoria, grey and thin, as if each week in here had been a ' +
  'year. His crown is dark.'

describe('King Alden', () => {
  it('looks as if the weeks in the crystal had been years', () => {
    const game = new Game([new Act4()])
    expect(new KingAlden().examine(game.state)).toBe(IN_THE_CRYSTAL)
  })

  it('never says Go home in his lines after the endings', () => {
    const game = new Game([new Act4()])
    const alden = new KingAlden()
    for (const flag of [
      FLAG_ACT4_REDEMPTION_ENDING,
      FLAG_ACT4_JUSTICE_ENDING,
      FLAG_ACT4_SACRIFICE_ENDING,
    ]) {
      const fresh = new Game([new Act4()])
      fresh.state.setStoryFlag(flag, true)
      expect(alden.talkTo(fresh.state)).not.toContain('Go home')
    }
    expect(alden.talkTo(game.state)).toContain('sleeps in the crystal')
  })

  it('is described with the current words in a save made before the rewrite', () => {
    const game = new Game([new Act4()])
    const alden =
      game.state.allRooms.ThroneChamber.getCharacterByName('King Alden')
    if (!alden) throw new Error('no king')
    alden.description =
      'The king of Eldoria, grey with the long years of the wound.'
    const loaded = new Game([new Act4()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
    const restored =
      loaded.state.allRooms.ThroneChamber.getCharacterByName('King Alden')
    expect(restored?.examine(loaded.state)).toBe(IN_THE_CRYSTAL)
  })
  /** A game in the Throne Chamber with the amulet and the elixir in hand. */
  function inThrone(): Game {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    game.state.currentRoom = game.state.allRooms.ThroneChamber
    game.state.inventory.push(new AncientAmulet(), new LifelightElixir())
    return game
  }

  it('cannot take the elixir while he hangs in the crystal', () => {
    const game = inThrone()
    const answer = executeCommands(game, [
      'give lifelight elixir to king alden',
    ])
    expect(answer).toContain('the king inside does not stir')
    expectNoStockReply(answer)
    expect(game.state.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)).toBe(false)
  })

  it('cannot take the amulet in the crystal, and refuses it awake', () => {
    const asleep = executeCommands(inThrone(), [
      'give ancient amulet to king alden',
    ])
    expect(asleep).toContain('The amulet clicks against the crystal.')
    expectNoStockReply(asleep)
    const game = inThrone()
    game.state.setStoryFlag(FLAG_ACT4_ELIXIR_ON_KING, true)
    const awake = executeCommands(game, ['give ancient amulet to king alden'])
    expect(awake).toContain('My half of it has cost me enough.')
    expectNoStockReply(awake)
  })
})
