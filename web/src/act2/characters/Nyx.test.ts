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
const STORM =
  '"The storm is heading for your village. This lets you see it coming."'
const RECOGNITION =
  'The words from the stone in the glade. You read them aloud there and ' +
  'did not know what they meant. You still do not, quite.'

const LATER =
  'Nyx is already half leaves again. "Go home the long way, Elior. Look before you step."'

describe('Nyx', () => {
  it('is a plain witness on the first meeting', () => {
    const game = new Game([new Act2()])

    const answer = new Nyx().talkTo(game.state)

    expect(answer).toContain(
      'The light over the altar folds into a woman no taller than you, ' +
        'barefoot, leaves caught in her hair. She looks at you the way you ' +
        'look at a road you have walked before.',
    )
    expect(answer).toContain(
      '"Elior. You gave the tree your acorn instead of keeping it. You ' +
        'answered the nymphs without bargaining. You brought me the three ' +
        'charms. That is enough."',
    )
    expect(answer).toContain(
      'She touches your forehead. Something settles behind your eyes, like ' +
        'a word you had forgotten coming back. She puts two things in your ' +
        'hands.',
    )
    expect(answer.indexOf('You have learned the spell')).toBeGreaterThan(
      answer.indexOf('She puts two things in your hands.'),
    )
    expect(answer).not.toMatch(/ancient|wisdom|millennia|ethereal/i)
  })

  it('describes her plainly', () => {
    expect(new Nyx().description).toBe(
      'A woman no taller than you, barefoot, with leaves caught in her ' +
        'hair. The moss is greener where she has stood.',
    )
  })

  it('ends the first talk with the refrain and the recognition line, inside the success reply', () => {
    const game = new Game([new Act2()])

    const answer = new Nyx().talkTo(game.state)

    const storm = answer.indexOf(STORM)
    expect(storm).toBeGreaterThan(-1)
    expect(answer.indexOf(REFRAIN)).toBeGreaterThan(storm)
    expect(answer.indexOf(RECOGNITION)).toBeGreaterThan(answer.indexOf(REFRAIN))
    expect(answer.startsWith('[success]')).toBe(true)
    expect(
      answer.endsWith(
        STORM + '\n\n' + REFRAIN + '\n\n' + RECOGNITION + '[/success]',
      ),
    ).toBe(true)
    expectMarkupWellFormed(answer)
  })

  it('answers later talks with the unchanged farewell', () => {
    const game = new Game([new Act2()])
    const nyx = new Nyx()
    nyx.talkTo(game.state)

    const answer = nyx.talkTo(game.state)

    expect(answer).toContain(LATER)
    expect(answer).not.toContain('Power follows')
  })

  it('gives a save that already met Nyx only the farewell', () => {
    const game = new Game([new Act2()])
    game.state.setStoryFlag(FLAG_NYX_TRIALS_COMPLETED, true)

    const answer = new Nyx().talkTo(game.state)

    expect(answer).toContain(LATER)
    expect(answer).not.toContain('Power follows')
  })
})
