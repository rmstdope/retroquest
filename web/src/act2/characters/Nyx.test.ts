import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { Nyx } from './Nyx'
import { FLAG_NYX_TRIALS_COMPLETED } from '../Act2StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

const REFRAIN =
  'Then her voice softens, as if she is repeating something she was told ' +
  'long ago. "Remember the old words, Elior: Power follows purpose; purpose ' +
  'follows truth."'
const RECOGNITION =
  'The words from the stone in the glade. You read them aloud there and ' +
  'did not know what they meant. You still do not, quite.'

describe('Nyx', () => {
  it('ends the first talk with the refrain and the recognition line, inside the success reply', () => {
    const game = new Game([new Act2()])

    const answer = new Nyx().talkTo(game.state)

    const blessing = answer.indexOf("May the forest's blessing guide you")
    expect(blessing).toBeGreaterThan(-1)
    expect(answer.indexOf(REFRAIN)).toBeGreaterThan(blessing)
    expect(answer.indexOf(RECOGNITION)).toBeGreaterThan(answer.indexOf(REFRAIN))
    expect(answer.startsWith('[success]')).toBe(true)
    expect(answer.endsWith(RECOGNITION + '[/success]')).toBe(true)
    expectMarkupWellFormed(answer)
  })

  it('answers later talks with the unchanged farewell', () => {
    const game = new Game([new Act2()])
    const nyx = new Nyx()
    nyx.talkTo(game.state)

    const answer = nyx.talkTo(game.state)

    expect(answer).toContain('"Go well, Elior.')
    expect(answer).not.toContain('Power follows')
  })

  it('gives a save that already met Nyx only the farewell', () => {
    const game = new Game([new Act2()])
    game.state.setStoryFlag(FLAG_NYX_TRIALS_COMPLETED, true)

    const answer = new Nyx().talkTo(game.state)

    expect(answer).toContain('"Go well, Elior.')
    expect(answer).not.toContain('Power follows')
  })
})
