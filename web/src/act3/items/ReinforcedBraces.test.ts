import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { ReinforcedBraces } from './ReinforcedBraces'
import { RustedLockerKey } from './RustedLockerKey'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('ReinforcedBraces markup', () => {
  it('using with an unrelated item uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new ReinforcedBraces().useWith(
      game.state,
      new RustedLockerKey(),
    )

    expect(answer).toContain("You can't use the reinforced braces with")
    expectMarkupWellFormed(answer)
  })
})
