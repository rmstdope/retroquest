import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_HELPED_ELDERLY_RESIDENTS } from '../Act2StoryFlags'
import { LocalCraftsmen } from './LocalCraftsmen'
import { MendSpell } from '../spells/MendSpell'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Local Craftsmen dialogue markup', () => {
  it('attributes the greeting after learning mend to the craftsmen', () => {
    const game = new Game([new Act2()])
    const craftsmen = new LocalCraftsmen()
    game.state.setStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS, true)
    craftsmen.talkTo(game.state)

    const answer = craftsmen.talkTo(game.state)

    expect(answer).toContain(
      'Back again. Whatever you mend, mend it slowly; a rushed join is the ' +
        'first to split.',
    )
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'local craftsmen')
  })
})

describe('Local Craftsmen and the elders', () => {
  it('point a stranger at the old folk on the lane, in their own words', () => {
    const game = new Game([new Act2()])

    const answer = new LocalCraftsmen().talkTo(game.state)

    expect(answer).toContain(
      'Old Tomas can barely get down this lane on his own; help our own ' +
        "first, and we'll talk.",
    )
    expect(answer).not.toContain('Perhaps you need')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'local craftsmen')
  })

  it('teach mend with the fixed gift line once the elders are helped', () => {
    const game = new Game([new Act2()])
    game.state.setStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS, true)

    const answer = new LocalCraftsmen().talkTo(game.state)

    expect(answer).toContain('the crack closes behind her thumb.')
    expect(answer).toContain('You have learned [spell_name]mend[/spell_name].')
    expect(answer).not.toContain('!')
    expect(game.state.hasSpell(new MendSpell().id)).toBe(true)
    expectMarkupWellFormed(answer)
  })
})
