import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { DispelSpell } from './DispelSpell'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('dispel on the Spectral Librarian', () => {
  it('slides off them, and they say whose it was first', () => {
    const game = new Game([new Act2()])
    game.state.learnSpell(new DispelSpell())
    game.state.currentRoom = game.state.allRooms.HiddenLibrary

    const out = game.commandParser.parse('cast dispel on spectral librarian')

    expect(out).toContain('like water off glass.')
    expect(out).toContain(
      'It was ours before it was yours. It does not work on the hand that ' +
        'wrote it down.',
    )
    expectMarkupWellFormed(out)
  })
})
