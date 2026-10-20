import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { AncientChronicle } from './AncientChronicle'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Ancient Chronicle markup', () => {
  it('has the librarian speak in tagged dialogue when study is blocked', () => {
    const game = new Game([new Act2()])

    const answer = new AncientChronicle().use(game.state)

    expect(answer).toContain('not for the unworthy')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'Spectral Librarian')
  })
})
