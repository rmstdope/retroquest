import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_COURT_HERALD_FORMAL_PRESENTATION,
  FLAG_READ_TRAVELERS_JOURNAL,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_SHOWED_JOURNAL_TO_HISTORIANS,
} from '../Act2StoryFlags'
import { GreatHall } from '../rooms/GreatHall'
import { Historians } from './Historians'
import { TravelersJournal } from '../items/TravelersJournal'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

/** Words of the old ancestor story that must be gone from the Historians. */
const OLD_LORE =
  /Lysander|Ravencrest|ancestor|bloodline|ley line|prophec|noble|crest|heritage appears/i

/** An Act II game for the historians' dialogue. */
function newGame(): Game {
  return new Game([new Act2()])
}

describe('Historians dialogue markup', () => {
  it('attributes the welcome to the historians', () => {
    const game = newGame()

    const answer = new Historians().talkTo(game.state)

    expect(answer).toContain("These are the court's archives")
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'historians')
  })

  it('attributes showing the journal and the follow-up to the historians', () => {
    const game = newGame()
    const historians = new Historians()
    game.state.setStoryFlag(FLAG_READ_TRAVELERS_JOURNAL, true)
    const shown = historians.giveItem(game.state, new TravelersJournal())

    const followUp = historians.talkTo(game.state)

    expect(shown).toContain('These are our birth rolls.')
    expect(followUp).toContain('Search the archive with us.')
    for (const answer of [shown, followUp]) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'historians')
      expectNoSpeechOutsideDialogue(answer)
    }
  })
})

describe('The Historians recognise their own shelves', () => {
  it('pushes an unread journal back, in their own words', () => {
    const game = newGame()
    const historians = new Historians()

    const refusal = historians.giveItem(game.state, new TravelersJournal())
    expect(refusal).toContain('push the journal back across the table.')
    expect(refusal).toContain(
      'We do not take papers from someone who cannot say what they are. ' +
        'Read it first.',
    )
    expect(refusal).not.toContain('You should')
    expectMarkupWellFormed(refusal)
    expectDialogueSpeaker(refusal, 'historians')
    expectNoSpeechOutsideDialogue(refusal)
    expect(game.state.getStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS)).toBe(
      false,
    )
    expect(historians.talkTo(game.state)).toContain(
      'If you have brought something written, show us.',
    )
  })

  it('shows the birth rolls on giving the journal', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_READ_TRAVELERS_JOURNAL, true)
    const text = new Historians().giveItem(game.state, new TravelersJournal())

    expect(findMarkupProblems(text)).toEqual([])
    expect(text).toContain(
      ' turn the pages slowly at first, then faster. One of them goes pale.',
    )
    expect(text).toContain('These are our birth rolls.')
    expect(text).toContain('Nobody has leave to copy the birth rolls. Nobody!')
    expect(text).toContain(
      'Search the archive with us; we will show you what he read.',
    )
    expect(text).not.toContain('Wardens')
    expect(text).not.toMatch(OLD_LORE)
    expect(game.state.getStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS)).toBe(
      true,
    )
  })

  it('invites the search every time until the archive is searched', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
    const historians = new Historians()

    for (let i = 0; i < 2; i++) {
      const text = historians.talkTo(game.state)
      expect(text).toContain(
        'Search the archive with us. If a thief has been at our shelves, ' +
          'we want to know what else he read.',
      )
      expect(text).not.toContain('One page is gone')
    }
  })

  it('names the missing page every time after the archive search', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)
    game.state.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
    new GreatHall().search(game.state)
    expect(game.state.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE)).toBe(true)
    const historians = new Historians()

    for (let i = 0; i < 2; i++) {
      const text = historians.talkTo(game.state)
      expect(findMarkupProblems(text)).toEqual([])
      expect(text).toContain(
        'We checked the Willowbrook roll against his notes. One page is gone ' +
          'from it, cut out at the binding, years ago by the look of the cut. ' +
          'The year you were born. His notes stop at the same place. Whatever ' +
          'he came for, someone hid it from him before he ever sat down.',
      )
      expect(text).not.toMatch(OLD_LORE)
    }
  })
})

describe('The Historians and the week the king went', () => {
  const WEEK_LINE =
    'You saw the last entry in our register, then. The week the king went. We have ' +
    'told ourselves it means nothing, and none of us believes it.'
  const LEAD_IN = 'One of them adds, more quietly:'

  it('adds the line as a quiet aside after the archive, every talk', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)
    game.state.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
    new GreatHall().search(game.state)
    const historians = new Historians()

    for (let i = 0; i < 2; i++) {
      const text = historians.talkTo(game.state)
      const roll = text.indexOf('We checked the Willowbrook roll')
      expect(text).toContain(WEEK_LINE)
      expect(text.indexOf(LEAD_IN)).toBeGreaterThan(roll)
      expect(text.indexOf(WEEK_LINE)).toBeGreaterThan(text.indexOf(LEAD_IN))
      expectMarkupWellFormed(text)
      expectDialogueSpeaker(text, 'historians')
    }
  })

  it('says nothing before the archive is worked through', () => {
    const game = newGame()
    const historians = new Historians()
    expect(historians.talkTo(game.state)).not.toContain(WEEK_LINE)

    game.state.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
    expect(historians.talkTo(game.state)).not.toContain(WEEK_LINE)
  })
})
