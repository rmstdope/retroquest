import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
} from '../Act4StoryFlags'
import { KingAlden } from './KingAlden'

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
})
