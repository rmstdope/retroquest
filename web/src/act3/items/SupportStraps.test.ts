import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { SupportStraps } from './SupportStraps'
import { RustedLockerKey } from './RustedLockerKey'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('SupportStraps markup', () => {
  it('using with an unrelated item uses only known, balanced tags', () => {
    const game = new Game([new Act3()])

    const answer = new SupportStraps().useWith(
      game.state,
      new RustedLockerKey(),
    )

    expect(answer).toContain("You can't use the support straps with")
    expectMarkupWellFormed(answer)
  })
})
