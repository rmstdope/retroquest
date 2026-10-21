import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act2 } from '../Act2'
import { DispelSpell } from '../spells/DispelSpell'
import { FLAG_SPECTRAL_LIBRARIAN_FRIENDLY } from '../Act2StoryFlags'
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
    expect(game.state.hasSpell('dispel')).toBe(false)
  })
})

describe('Ancient Chronicle (rq-roe.5)', () => {
  function friendlyGame(): Game {
    const game = new Game([new Act2()])
    game.state.setStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY, true)
    return game
  }

  it('mentions the sigil on the cover when examined', () => {
    expect(new AncientChronicle().description).toContain(
      'On its cover, worn almost smooth, is the sun rising over three linked rings.',
    )
  })

  it('teaches dispel and carries the Malakar warning on first use', () => {
    const game = friendlyGame()
    const text = new AncientChronicle().use(game.state)

    expect(findMarkupProblems(text)).toEqual([])
    expect(game.state.hasSpell('dispel')).toBe(true)
    expect(text).toContain('the mark of the Wardens of the Dawn')
    expect(text).toContain('[spell_name]dispel[/spell_name]')
    expect(text).toContain(
      'the one called Malakar seeks the blood of Willowbrook',
    )
    expect(text).not.toContain('Chosen One')
  })

  it('shows only the reminder on later uses', () => {
    const game = friendlyGame()
    const chronicle = new AncientChronicle()
    chronicle.use(game.state)
    const again = chronicle.use(game.state)

    expect(findMarkupProblems(again)).toEqual([])
    expect(again).toContain('You turn again to the newer ink')
    expect(again).toContain(
      'the one called Malakar seeks the blood of Willowbrook',
    )
    expect(again).not.toContain('learned')
    expect(again).not.toContain('Wardens were few')
  })

  it('remembers the first reading across save and load', () => {
    const game = friendlyGame()
    new AncientChronicle().use(game.state)
    const loaded = new Game([new Act2()])
    loaded.loadSaveData(game.toSaveData())
    const text = new AncientChronicle().use(loaded.state)
    expect(text).toContain('You turn again')
  })

  it('shows the learned line as a success line', () => {
    const text = new AncientChronicle().use(friendlyGame().state)
    expect(text).toContain('[success]You study the pages')
  })

  it('still shows the first reading when dispel was learned elsewhere', () => {
    const game = friendlyGame()
    game.state.learnSpell(new DispelSpell())
    expect(new AncientChronicle().use(game.state)).toContain('Wardens were few')
  })
})
